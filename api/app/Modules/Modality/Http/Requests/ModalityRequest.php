<?php

declare(strict_types=1);

namespace App\Modules\Modality\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ModalityRequest extends FormRequest
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

        if ($this->has('description')) {
            $desc = $this->input('description');
            if ($desc === '' || $desc === null) {
                $merge['description'] = null;
            }
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        $companyId = app('company')->company()?->id;
        $modalityId = $this->route('id');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('modalities', 'name')
                    ->where(fn ($q) => $q->where('company_id', $companyId))
                    ->ignore($modalityId),
            ],
            'description' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
