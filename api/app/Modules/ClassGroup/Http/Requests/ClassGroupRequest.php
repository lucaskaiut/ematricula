<?php

declare(strict_types=1);

namespace App\Modules\ClassGroup\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ClassGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('name') && is_string($this->input('name'))) {
            $merge['name'] = trim($this->input('name'));
        }

        foreach (['starts_at', 'ends_at'] as $field) {
            if (! $this->has($field)) {
                continue;
            }
            $v = $this->input($field);
            if (is_string($v) && preg_match('/^\d{2}:\d{2}$/', $v)) {
                $merge[$field] = $v.':00';
            }
        }

        if ($this->has('weekdays')) {
            $w = $this->input('weekdays');
            if (is_string($w)) {
                $decoded = json_decode($w, true);
                if (is_array($decoded)) {
                    $merge['weekdays'] = array_map(static fn ($x) => (int) $x, $decoded);
                }
            } elseif (is_array($w)) {
                $merge['weekdays'] = array_map(static fn ($x) => (int) $x, $w);
            }
        }

        if ($this->has('max_capacity')) {
            $c = $this->input('max_capacity');
            if ($c === '' || $c === null) {
                $merge['max_capacity'] = null;
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $companyId = app('company')->company()?->id;
        $classGroupId = $this->route('id');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('class_groups', 'name')
                    ->where(fn ($q) => $q->where('company_id', $companyId))
                    ->ignore($classGroupId),
            ],
            'modality_id' => [
                'required',
                'integer',
                Rule::exists('modalities', 'id')->where(
                    fn ($q) => $q->where('company_id', $companyId),
                ),
            ],
            'teacher_person_id' => [
                'required',
                'integer',
                Rule::exists('people', 'id')->where(
                    fn ($q) => $q->where('company_id', $companyId)->where('profile', 'teacher'),
                ),
            ],
            'max_capacity' => ['nullable', 'integer', 'min:1'],
            'weekdays' => ['required', 'array', 'min:1'],
            'weekdays.*' => ['integer', Rule::in([0, 1, 2, 3, 4, 5, 6])],
            'starts_at' => ['required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'ends_at' => ['required', 'string', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->isNotEmpty()) {
                return;
            }
            $start = $this->normalizeTimeToHms((string) $this->input('starts_at'));
            $end = $this->normalizeTimeToHms((string) $this->input('ends_at'));
            if ($start === null || $end === null) {
                return;
            }
            if ($end <= $start) {
                $v->errors()->add('ends_at', 'O horário de fim deve ser posterior ao de início.');
            }
        });
    }

    protected function passedValidation(): void
    {
        $this->merge([
            'starts_at' => $this->normalizeTimeToHms((string) $this->input('starts_at')) ?? $this->input('starts_at'),
            'ends_at' => $this->normalizeTimeToHms((string) $this->input('ends_at')) ?? $this->input('ends_at'),
        ]);
    }

    private function normalizeTimeToHms(string $value): ?string
    {
        if (preg_match('/^(\d{2}):(\d{2}):(\d{2})$/', $value, $m)) {
            return sprintf('%02d:%02d:%02d', (int) $m[1], (int) $m[2], (int) $m[3]);
        }
        if (preg_match('/^(\d{2}):(\d{2})$/', $value, $m)) {
            return sprintf('%02d:%02d:00', (int) $m[1], (int) $m[2]);
        }

        return null;
    }
}
