<?php

declare(strict_types=1);

namespace App\Modules\Subscription\Http\Resources;

use App\Modules\Invoice\Http\Resources\InvoiceResource;
use App\Modules\Plan\Http\Resources\PlanResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'enrollment_id' => $this->enrollment_id,
            'plan_id' => $this->plan_id,
            'price' => $this->formatMoney($this->price),
            'billing_cycle' => $this->billing_cycle,
            'billing_interval' => $this->billing_interval,
            'started_at' => $this->started_at?->format('Y-m-d'),
            'next_billing_at' => $this->next_billing_at?->format('Y-m-d'),
            'status' => $this->status->value,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'enrollment' => $this->whenLoaded(
                'enrollment',
                fn () => $this->enrollment !== null
                    ? [
                        'id' => $this->enrollment->id,
                        'student_person_id' => $this->enrollment->student_person_id,
                        'class_group_id' => $this->enrollment->class_group_id,
                        'status' => $this->enrollment->status->value,
                    ]
                    : null,
            ),
            'plan' => $this->whenLoaded(
                'plan',
                fn () => $this->plan !== null
                    ? new PlanResource($this->plan)
                    : null,
            ),
            'invoices' => $this->whenLoaded(
                'invoices',
                fn () => InvoiceResource::collection($this->invoices),
            ),
        ];
    }

    private function formatMoney(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return number_format((float) $value, 2, '.', '');
    }
}
