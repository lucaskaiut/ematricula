<?php

declare(strict_types=1);

namespace App\Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id')
            ?? $this->route('user')
            ?? $this->input('id');

        $isUpdate = in_array($this->method(), ['PUT', 'PATCH'], true);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where('company_id', $this->user()?->company_id),
            ],
            'password' => [
                $isUpdate ? 'nullable' : 'required',
                'string',
                'min:8',
            ],
        ];
    }
}
