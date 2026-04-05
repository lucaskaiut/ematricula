<?php

declare(strict_types=1);

namespace App\Modules\Plan\Http\Requests;

use App\Modules\Plan\Domain\Enums\BillingCycle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlanRequest extends FormRequest
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

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $companyId = app('company')->company()?->id;
        $planId = $this->route('id');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('plans', 'name')
                    ->where(fn ($q) => $q->where('company_id', $companyId))
                    ->ignore($planId),
            ],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_cycle' => ['required', Rule::enum(BillingCycle::class)],
            'billing_interval' => ['required', 'integer', 'min:1'],
        ];
    }
}
