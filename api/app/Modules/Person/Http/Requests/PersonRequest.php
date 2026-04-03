<?php

declare(strict_types=1);

namespace App\Modules\Person\Http\Requests;

use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Enums\PersonStatus;
use App\Modules\Person\Domain\Models\Person;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PersonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('full_name') && is_string($this->input('full_name'))) {
            $merge['full_name'] = trim(preg_replace('/\s+/u', ' ', $this->input('full_name')) ?? '');
        }

        if ($this->has('email') && is_string($this->input('email'))) {
            $merge['email'] = strtolower(trim($this->input('email')));
        }

        if ($this->has('cpf')) {
            $raw = $this->input('cpf');
            if ($raw === null || $raw === '') {
                $merge['cpf'] = null;
            } elseif (is_string($raw)) {
                $digits = preg_replace('/\D/', '', $raw) ?? '';
                $merge['cpf'] = $digits !== '' ? $digits : null;
            }
        }

        if ($this->has('phone') && is_string($this->input('phone'))) {
            $merge['phone'] = preg_replace('/\D/', '', $this->input('phone')) ?? '';
        }

        if ($this->input('profile') === PersonProfile::Teacher->value) {
            $merge['guardian_person_id'] = null;
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $companyId = app('company')->company()?->id;
        $personId = $this->route('id');

        return [
            'full_name' => ['required', 'string', 'max:255'],
            'birth_date' => ['required', 'date', 'before:today'],
            'cpf' => [
                'nullable',
                'string',
                'size:11',
                'regex:/^[0-9]{11}$/',
                Rule::unique('people', 'cpf')
                    ->where(fn ($q) => $q->where('company_id', $companyId))
                    ->ignore($personId),
            ],
            'phone' => ['required', 'string', 'regex:/^[0-9]{10,13}$/'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email:rfc',
                'max:255',
                Rule::unique('people', 'email')
                    ->where(fn ($q) => $q->where('company_id', $companyId))
                    ->ignore($personId),
            ],
            'guardian_person_id' => [
                Rule::excludeIf(fn () => $this->input('profile') === PersonProfile::Teacher->value),
                'nullable',
                'integer',
                Rule::requiredIf(fn () => $this->requiresGuardian()),
                Rule::exists('people', 'id')->where(
                    fn ($q) => $q->where('company_id', $companyId),
                ),
            ],
            'status' => ['required', Rule::enum(PersonStatus::class)],
            'notes' => ['nullable', 'string', 'max:10000'],
            'profile' => ['required', Rule::enum(PersonProfile::class)],
            'modality_ids' => [
                Rule::excludeIf(fn () => $this->input('profile') !== PersonProfile::Teacher->value),
                'nullable',
                'array',
                'max:50',
            ],
            'modality_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('modalities', 'id')->where(
                    fn ($q) => $q->where('company_id', $companyId),
                ),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->input('profile') !== PersonProfile::Student->value) {
                return;
            }

            $guardianId = $this->input('guardian_person_id');
            if ($guardianId === null || $guardianId === '') {
                return;
            }

            $personId = $this->route('id');
            if ($personId !== null && (int) $guardianId === (int) $personId) {
                $validator->errors()->add(
                    'guardian_person_id',
                    'O responsável não pode ser a própria pessoa.',
                );
            }

            $guardian = Person::query()->find((int) $guardianId);
            if ($guardian && $guardian->isMinor()) {
                $validator->errors()->add(
                    'guardian_person_id',
                    'O responsável deve ser maior de idade.',
                );
            }
        });
    }

    private function requiresGuardian(): bool
    {
        if ($this->input('profile') !== PersonProfile::Student->value) {
            return false;
        }

        $birth = $this->input('birth_date');
        if (! is_string($birth) && ! $birth instanceof \DateTimeInterface) {
            return false;
        }

        try {
            $date = Carbon::parse($birth)->startOfDay();
        } catch (\Throwable) {
            return false;
        }

        return $date->gt(today()->subYears(18));
    }
}
