<?php

declare(strict_types=1);

namespace App\Modules\User\Domain\Services;

use App\Models\User;
use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Acl\Domain\Models\Role;
use App\Modules\Company\Domain\Scopes\CompanyScope;
use App\Modules\Company\Domain\Services\CompanyService;
use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use Illuminate\Support\Facades\Hash;

class UserService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = User::class;

    protected function allowedOrderBy(): array
    {
        return ['id', 'name', 'email', 'created_at', 'updated_at'];
    }

    public function register(array $data): User
    {
        $company = app(CompanyService::class)->create($data['company']);

        $all = array_map(static fn (Permission $p) => $p->value, Permission::cases());

        $role = Role::query()->create([
            'company_id' => $company->id,
            'name' => 'Administrador',
            'description' => 'Acesso total ao sistema',
            'permissions' => $all,
        ]);

        $userPayload = $data['user'];
        $userPayload['role_id'] = $role->id;

        return $company->users()->createQuietly($userPayload);
    }

    public function login(array $data): User
    {
        $user = User::withoutGlobalScope(CompanyScope::class)->where(['email' => $data['email']])->first();

        if (! $user) {
            throw new \Exception('Invalid credentials');
        }

        if (! Hash::check($data['password'], $user->password)) {
            throw new \Exception('Invalid credentials');
        }

        $user->load('role');

        $token = $user->createToken('auth_token')->plainTextToken;
        $user->token = $token;

        return $user;
    }
}
