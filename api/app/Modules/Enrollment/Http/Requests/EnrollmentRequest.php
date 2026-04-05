<?php

declare(strict_types=1);

namespace App\Modules\Enrollment\Http\Requests;

use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Models\Enrollment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class EnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('ends_on')) {
            $v = $this->input('ends_on');
            if ($v === '' || $v === null) {
                $merge['ends_on'] = null;
            }
        }

        $enrollmentId = $this->route('id');
        if ($enrollmentId !== null && ($this->isMethod('PUT') || $this->isMethod('PATCH'))) {
            $existing = Enrollment::query()->whereKey($enrollmentId)->first();
            if ($existing !== null) {
                if (! $this->has('class_group_id')) {
                    $merge['class_group_id'] = $existing->class_group_id;
                }
                if (! $this->has('student_person_id')) {
                    $merge['student_person_id'] = $existing->student_person_id;
                }
                if (! $this->has('starts_on')) {
                    $merge['starts_on'] = $existing->starts_on?->format('Y-m-d');
                }
                if (! $this->has('ends_on')) {
                    $merge['ends_on'] = $existing->ends_on?->format('Y-m-d');
                }
                if (! $this->has('status')) {
                    $merge['status'] = $existing->status->value;
                }
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $companyId = app('company')->company()?->id;
        $enrollmentId = $this->route('id');
        $isCreate = $this->isMethod('POST');

        $planIdRules = [
            'integer',
            Rule::exists('plans', 'id')->where(
                fn ($q) => $q->where('company_id', $companyId),
            ),
            Rule::exists('class_group_plans', 'plan_id')->where(
                fn ($q) => $q->where('class_group_id', (int) $this->input('class_group_id')),
            ),
        ];

        return [
            'student_person_id' => [
                'required',
                'integer',
                Rule::exists('people', 'id')->where(
                    fn ($q) => $q->where('company_id', $companyId)->where('profile', 'student'),
                ),
                Rule::unique('enrollments', 'student_person_id')
                    ->where('company_id', $companyId)
                    ->where(
                        'class_group_id',
                        (int) $this->input('class_group_id'),
                    )
                    ->where('status', '!=', EnrollmentStatus::Cancelled->value)
                    ->ignore($enrollmentId),
            ],
            'class_group_id' => [
                'required',
                'integer',
                Rule::exists('class_groups', 'id')->where(
                    fn ($q) => $q->where('company_id', $companyId),
                ),
            ],
            'starts_on' => ['required', 'date_format:Y-m-d'],
            'ends_on' => ['nullable', 'date_format:Y-m-d'],
            'status' => ['required', Rule::enum(EnrollmentStatus::class)],
            'plan_id' => $isCreate
                ? array_merge(['required'], $planIdRules)
                : array_merge(['nullable'], $planIdRules),
            'billing_starts_on' => $isCreate
                ? ['required', 'date_format:Y-m-d']
                : ['nullable', 'date_format:Y-m-d'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->isNotEmpty()) {
                return;
            }

            $enrollmentId = $this->route('id');
            if ($enrollmentId !== null && ($this->isMethod('PUT') || $this->isMethod('PATCH'))) {
                $existing = Enrollment::query()->whereKey($enrollmentId)->first();
                if (
                    $existing !== null
                    && $existing->status === EnrollmentStatus::Cancelled
                    && (string) $this->input('status') !== EnrollmentStatus::Cancelled->value
                ) {
                    $v->errors()->add('status', 'Não é possível reativar uma matrícula cancelada.');

                    return;
                }
            }

            $starts = $this->input('starts_on');
            $ends = $this->input('ends_on');
            if ($ends === null || $ends === '') {
                return;
            }
            if (! is_string($starts) || ! is_string($ends)) {
                return;
            }
            if ($ends < $starts) {
                $v->errors()->add('ends_on', 'A data de término deve ser igual ou posterior à de início.');
            }
        });
    }
}
