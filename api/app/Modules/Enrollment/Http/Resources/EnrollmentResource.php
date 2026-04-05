<?php

declare(strict_types=1);

namespace App\Modules\Enrollment\Http\Resources;

use App\Modules\Person\Http\Resources\PersonSummaryResource;
use App\Modules\Plan\Http\Resources\PlanResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'student_person_id' => $this->student_person_id,
            'class_group_id' => $this->class_group_id,
            'starts_on' => $this->starts_on?->format('Y-m-d'),
            'ends_on' => $this->ends_on?->format('Y-m-d'),
            'status' => $this->status->value,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'student' => $this->whenLoaded(
                'student',
                fn () => $this->student !== null
                    ? new PersonSummaryResource($this->student)
                    : null,
            ),
            'class_group' => $this->whenLoaded(
                'classGroup',
                fn () => $this->classGroup !== null
                    ? [
                        'id' => $this->classGroup->id,
                        'name' => $this->classGroup->name,
                        'max_capacity' => $this->classGroup->max_capacity,
                        'modality' => $this->classGroup->relationLoaded('modality') && $this->classGroup->modality !== null
                            ? [
                                'id' => $this->classGroup->modality->id,
                                'name' => $this->classGroup->modality->name,
                            ]
                            : null,
                    ]
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
            'active_subscription' => $this->whenLoaded(
                'activeSubscription',
                fn () => $this->activeSubscription !== null
                    ? [
                        'id' => $this->activeSubscription->id,
                        'plan_id' => $this->activeSubscription->plan_id,
                        'price' => $this->formatMoney($this->activeSubscription->price),
                        'billing_cycle' => $this->activeSubscription->billing_cycle,
                        'billing_interval' => $this->activeSubscription->billing_interval,
                        'started_at' => $this->activeSubscription->started_at?->format('Y-m-d'),
                        'next_billing_at' => $this->activeSubscription->next_billing_at?->format('Y-m-d'),
                        'status' => $this->activeSubscription->status->value,
                        'plan' => $this->activeSubscription->relationLoaded('plan') && $this->activeSubscription->plan !== null
                            ? new PlanResource($this->activeSubscription->plan)
                            : null,
                    ]
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
