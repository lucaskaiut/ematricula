<?php

declare(strict_types=1);

namespace App\Modules\Invoice\Domain\Services;

use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class InvoiceService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = Invoice::class;

    protected function allowedOrderBy(): array
    {
        return [
            'id',
            'subscription_id',
            'amount',
            'due_date',
            'status',
            'paid_at',
            'created_at',
            'updated_at',
        ];
    }

    protected function relationshipAllOfFilters(): array
    {
        return [
            'enrollment_id' => ['subscription', 'enrollment_id'],
        ];
    }

    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);

        if (array_key_exists('status', $attributes)) {
            $status = InvoiceStatus::from((string) $attributes['status']);
            if ($status === InvoiceStatus::Paid) {
                if ($model->status === InvoiceStatus::Paid) {
                    return $model->fresh(['subscription.enrollment', 'subscription.plan']) ?? $model;
                }
                if ($model->status !== InvoiceStatus::Pending) {
                    throw ValidationException::withMessages([
                        'status' => ['Somente faturas pendentes podem ser quitadas.'],
                    ]);
                }
                $model->status = InvoiceStatus::Paid;
                $model->paid_at = now();
                $model->save();
            }
        }

        return $model->fresh(['subscription.enrollment', 'subscription.plan']) ?? $model;
    }
}
