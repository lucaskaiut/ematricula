<?php

declare(strict_types=1);

namespace App\Modules\Subscription\Domain\Services;

use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use App\Modules\Subscription\Domain\Enums\SubscriptionStatus;
use App\Modules\Subscription\Domain\Models\Subscription;
use Illuminate\Database\Eloquent\Model;

class SubscriptionService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = Subscription::class;

    protected function allowedOrderBy(): array
    {
        return [
            'id',
            'enrollment_id',
            'plan_id',
            'price',
            'started_at',
            'next_billing_at',
            'status',
            'created_at',
            'updated_at',
        ];
    }

    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);

        if ($model->status === SubscriptionStatus::Canceled) {
            return $model->fresh(['enrollment.student', 'plan', 'invoices']) ?? $model;
        }

        if (array_key_exists('status', $attributes)) {
            $status = SubscriptionStatus::from((string) $attributes['status']);
            if ($status === SubscriptionStatus::Canceled) {
                $model->status = SubscriptionStatus::Canceled;
                $model->save();
            }
        }

        return $model->fresh(['enrollment.student', 'plan', 'invoices']) ?? $model;
    }
}
