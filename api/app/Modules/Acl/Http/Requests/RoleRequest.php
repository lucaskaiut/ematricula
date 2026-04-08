<?php

declare(strict_types=1);

namespace App\Modules\Acl\Http\Requests;

use App\Modules\Acl\Domain\Enums\Permission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('id')
            ?? $this->route('role')
            ?? $this->input('id');

        $permissionRule = ['required', 'array'];
        $permissionEach = ['string', Rule::in(Permission::values())];

        return [
            'name' => [
                'required',
                'string',
                'max:120',
                Rule::unique('roles', 'name')
                    ->where('company_id', $this->user()?->company_id)
                    ->ignore($roleId),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => $permissionRule,
            'permissions.*' => $permissionEach,
        ];
    }
}
