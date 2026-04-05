<?php

declare(strict_types=1);

namespace App\Modules\Subscription\Domain\Services;

use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Subscription\Domain\Enums\SubscriptionStatus;
use App\Modules\Subscription\Domain\Models\Subscription;
use App\Modules\Subscription\Domain\Support\BillingDate;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubscriptionRecurrenceService
{
    public function invoiceDaysBeforeDue(): int
    {
        return max(0, (int) config('billing.invoice_generate_days_before_due', 5));
    }

    public function nextBillingAtEligibleForAutomaticGeneration(
        CarbonImmutable $today,
        string $nextBillingAtYmd,
    ): bool {
        $threshold = $today->addDays($this->invoiceDaysBeforeDue())->toDateString();

        return $nextBillingAtYmd <= $threshold;
    }

    public function shouldCreateFirstEnrollmentInvoice(CarbonImmutable $today, string $billingStartsOnYmd): bool
    {
        return $this->nextBillingAtEligibleForAutomaticGeneration($today, $billingStartsOnYmd);
    }

    public function createInvoiceForCurrentCycleAndAdvance(Subscription $locked): void
    {
        $dueString = $locked->next_billing_at->toDateString();

        Invoice::query()->firstOrCreate(
            [
                'subscription_id' => $locked->id,
                'due_date' => $dueString,
            ],
            [
                'company_id' => $locked->company_id,
                'amount' => $locked->price,
                'status' => InvoiceStatus::Pending,
                'paid_at' => null,
            ]
        );

        $locked->refresh();

        if ($locked->next_billing_at->toDateString() !== $dueString) {
            return;
        }

        $locked->next_billing_at = BillingDate::addCycle(
            CarbonImmutable::parse($dueString),
            (string) $locked->billing_cycle,
            (int) $locked->billing_interval,
        )->toDateString();
        $locked->save();
    }

    public function runAutomaticForSubscription(Subscription $subscription, CarbonImmutable $today): void
    {
        DB::transaction(function () use ($subscription, $today): void {
            $locked = Subscription::query()->whereKey($subscription->id)->lockForUpdate()->first();
            if ($locked === null) {
                return;
            }
            if ($locked->status !== SubscriptionStatus::Active) {
                return;
            }
            if (! $this->nextBillingAtEligibleForAutomaticGeneration(
                $today,
                $locked->next_billing_at->toDateString(),
            )) {
                return;
            }

            $this->createInvoiceForCurrentCycleAndAdvance($locked);
        });
    }

    public function generateNextInvoiceManually(int|string $subscriptionId): Subscription
    {
        return DB::transaction(function () use ($subscriptionId): Subscription {
            $locked = Subscription::query()->whereKey($subscriptionId)->lockForUpdate()->firstOrFail();
            if ($locked->status !== SubscriptionStatus::Active) {
                throw ValidationException::withMessages([
                    'subscription' => ['Somente assinaturas ativas podem gerar a próxima fatura.'],
                ]);
            }

            $this->createInvoiceForCurrentCycleAndAdvance($locked);

            return $locked->fresh(['enrollment.student', 'plan', 'invoices']) ?? $locked;
        });
    }
}
