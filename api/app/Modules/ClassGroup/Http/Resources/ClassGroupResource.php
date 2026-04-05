<?php

declare(strict_types=1);

namespace App\Modules\ClassGroup\Http\Resources;

use App\Modules\Person\Http\Resources\PersonSummaryResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassGroupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'modality_id' => $this->modality_id,
            'teacher_person_id' => $this->teacher_person_id,
            'max_capacity' => $this->max_capacity,
            'weekdays' => $this->weekdays,
            'starts_at' => $this->formatTime($this->starts_at),
            'ends_at' => $this->formatTime($this->ends_at),
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'modality' => $this->whenLoaded(
                'modality',
                fn () => $this->modality !== null
                    ? [
                        'id' => $this->modality->id,
                        'name' => $this->modality->name,
                    ]
                    : null,
            ),
            'teacher' => $this->whenLoaded(
                'teacher',
                fn () => $this->teacher !== null
                    ? new PersonSummaryResource($this->teacher)
                    : null,
            ),
            'creator' => $this->whenLoaded(
                'creator',
                fn () => $this->creator !== null
                    ? [
                        'id' => $this->creator->id,
                        'name' => $this->creator->name,
                        'email' => $this->creator->email,
                    ]
                    : null,
            ),
            'updater' => $this->whenLoaded(
                'updater',
                fn () => $this->updater !== null
                    ? [
                        'id' => $this->updater->id,
                        'name' => $this->updater->name,
                        'email' => $this->updater->email,
                    ]
                    : null,
            ),
            'plans' => $this->whenLoaded(
                'plans',
                fn () => $this->plans->map(fn ($plan) => [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'price' => $this->formatMoney($plan->price),
                    'billing_cycle' => $plan->billing_cycle->value,
                    'billing_interval' => $plan->billing_interval,
                ])->values()->all(),
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

    private function formatTime(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        if (is_string($value)) {
            if (preg_match('/^(\d{2}:\d{2})(:\d{2})?$/', $value, $m)) {
                return $m[1];
            }

            return $value;
        }
        if (method_exists($value, 'format')) {
            return $value->format('H:i');
        }

        return null;
    }
}
