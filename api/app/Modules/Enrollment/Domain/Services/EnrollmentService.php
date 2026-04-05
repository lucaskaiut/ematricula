<?php

declare(strict_types=1);

namespace App\Modules\Enrollment\Domain\Services;

use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Models\Enrollment;
use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Plan\Domain\Models\Plan;
use App\Modules\Subscription\Domain\Enums\SubscriptionStatus;
use App\Modules\Subscription\Domain\Models\Subscription;
use App\Modules\Subscription\Domain\Services\SubscriptionRecurrenceService;
use App\Modules\Subscription\Domain\Support\BillingDate;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EnrollmentService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = Enrollment::class;

    protected function allowedOrderBy(): array
    {
        return [
            'id',
            'student_person_id',
            'class_group_id',
            'starts_on',
            'ends_on',
            'status',
            'created_at',
            'updated_at',
        ];
    }

    public function create(array $attributes): Model
    {
        $planId = (int) $attributes['plan_id'];
        $billingStartsOn = (string) $attributes['billing_starts_on'];
        unset($attributes['plan_id'], $attributes['billing_starts_on']);

        $status = EnrollmentStatus::from((string) $attributes['status']);
        $this->assertClassGroupCapacity(
            (int) $attributes['class_group_id'],
            $status,
            null,
        );

        return DB::transaction(function () use ($attributes, $planId, $billingStartsOn) {
            $enrollment = $this->model()->create($attributes);
            $plan = Plan::query()->whereKey($planId)->firstOrFail();

            $subscription = Subscription::query()->create([
                'company_id' => $enrollment->company_id,
                'enrollment_id' => $enrollment->id,
                'plan_id' => $plan->id,
                'price' => $plan->price,
                'billing_cycle' => $plan->billing_cycle->value,
                'billing_interval' => $plan->billing_interval,
                'started_at' => $billingStartsOn,
                'next_billing_at' => $billingStartsOn,
                'status' => SubscriptionStatus::Active,
            ]);

            $recurrence = app(SubscriptionRecurrenceService::class);
            $today = CarbonImmutable::parse(now()->toDateString())->startOfDay();
            if ($recurrence->shouldCreateFirstEnrollmentInvoice($today, $billingStartsOn)) {
                Invoice::query()->create([
                    'company_id' => $enrollment->company_id,
                    'subscription_id' => $subscription->id,
                    'amount' => $subscription->price,
                    'due_date' => $billingStartsOn,
                    'status' => InvoiceStatus::Pending,
                ]);
            }

            return $enrollment->fresh([
                'student',
                'classGroup.modality',
                'creator',
                'updater',
                'activeSubscription.plan',
            ]) ?? $enrollment;
        });
    }

    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);

        $planId = null;
        if (array_key_exists('plan_id', $attributes)) {
            $planId = (int) $attributes['plan_id'];
            unset($attributes['plan_id']);
        }

        $billingStartsOn = null;
        if (array_key_exists('billing_starts_on', $attributes)) {
            $billingStartsOn = (string) $attributes['billing_starts_on'];
            unset($attributes['billing_starts_on']);
        }

        $targetClassGroupId = array_key_exists('class_group_id', $attributes)
            ? (int) $attributes['class_group_id']
            : (int) $model->class_group_id;

        $targetStatus = array_key_exists('status', $attributes)
            ? EnrollmentStatus::from((string) $attributes['status'])
            : $model->status;

        $this->assertClassGroupCapacity(
            $targetClassGroupId,
            $targetStatus,
            (int) $model->id,
        );

        return DB::transaction(function () use ($model, $attributes, $planId, $billingStartsOn) {
            $model->update($attributes);

            $fresh = $model->fresh() ?? $model;

            if ($fresh->status === EnrollmentStatus::Cancelled) {
                $this->cancelActiveSubscriptions($fresh);
            }

            if ($planId !== null) {
                $this->replaceSubscriptionPlanIfNeeded($fresh, $planId, $billingStartsOn);
            }

            return $fresh->fresh([
                'student',
                'classGroup.modality',
                'creator',
                'updater',
                'activeSubscription.plan',
            ]) ?? $fresh;
        });
    }

    private function cancelActiveSubscriptions(Enrollment $enrollment): void
    {
        Subscription::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('status', SubscriptionStatus::Active)
            ->update(['status' => SubscriptionStatus::Canceled]);
    }

    private function replaceSubscriptionPlanIfNeeded(
        Enrollment $enrollment,
        int $newPlanId,
        ?string $billingStartsOn,
    ): void {
        $active = Subscription::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('status', SubscriptionStatus::Active)
            ->first();

        if ($active !== null && (int) $active->plan_id === $newPlanId) {
            return;
        }

        if ($active !== null) {
            $active->status = SubscriptionStatus::Canceled;
            $active->save();
        }

        $plan = Plan::query()->whereKey($newPlanId)->firstOrFail();
        $anchor = ($billingStartsOn !== null && $billingStartsOn !== '')
            ? CarbonImmutable::parse($billingStartsOn)->toDateString()
            : now()->toDateString();
        $next = BillingDate::addCycle(
            CarbonImmutable::parse($anchor),
            $plan->billing_cycle->value,
            (int) $plan->billing_interval,
        )->toDateString();

        Subscription::query()->create([
            'company_id' => $enrollment->company_id,
            'enrollment_id' => $enrollment->id,
            'plan_id' => $plan->id,
            'price' => $plan->price,
            'billing_cycle' => $plan->billing_cycle->value,
            'billing_interval' => $plan->billing_interval,
            'started_at' => $anchor,
            'next_billing_at' => $next,
            'status' => SubscriptionStatus::Active,
        ]);
    }

    private function assertClassGroupCapacity(
        int $classGroupId,
        EnrollmentStatus $status,
        ?int $excludeEnrollmentId,
    ): void {
        if ($status === EnrollmentStatus::Cancelled) {
            return;
        }

        $classGroup = ClassGroup::query()->whereKey($classGroupId)->first();
        if ($classGroup === null || $classGroup->max_capacity === null) {
            return;
        }

        $max = (int) $classGroup->max_capacity;

        $query = Enrollment::query()
            ->where('class_group_id', $classGroupId)
            ->whereIn('status', [EnrollmentStatus::Active, EnrollmentStatus::Locked]);

        if ($excludeEnrollmentId !== null) {
            $query->where('id', '!=', $excludeEnrollmentId);
        }

        $occupied = $query->count();

        if ($occupied >= $max) {
            throw ValidationException::withMessages([
                'class_group_id' => ['A turma atingiu a capacidade máxima.'],
            ]);
        }
    }
}
