<?php

declare(strict_types=1);

namespace App\Modules\Invoice\Http\Resources;

use App\Modules\Subscription\Http\Resources\SubscriptionResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'subscription_id' => $this->subscription_id,
            'amount' => $this->formatMoney($this->amount),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'status' => $this->status->value,
            'paid_at' => $this->paid_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'subscription' => $this->whenLoaded(
                'subscription',
                fn () => $this->subscription !== null
                    ? new SubscriptionResource($this->subscription)
                    : null,
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
