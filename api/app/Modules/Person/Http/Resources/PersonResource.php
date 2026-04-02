<?php

declare(strict_types=1);

namespace App\Modules\Person\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'full_name' => $this->full_name,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'cpf' => $this->cpf,
            'phone' => $this->phone,
            'email' => $this->email,
            'guardian_person_id' => $this->guardian_person_id,
            'status' => $this->status?->value,
            'notes' => $this->notes,
            'profile' => $this->profile?->value,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'guardian' => $this->whenLoaded(
                'guardian',
                fn () => $this->guardian !== null
                    ? new PersonSummaryResource($this->guardian)
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
        ];
    }
}
