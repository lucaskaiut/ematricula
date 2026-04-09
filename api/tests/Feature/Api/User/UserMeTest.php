<?php

declare(strict_types=1);

namespace Tests\Feature\Api\User;

use App\Modules\Acl\Domain\Enums\Permission;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class UserMeTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_guest_cannot_access_me(): void
    {
        $this->getJson('/api/user/me')->assertUnauthorized();
    }

    public function test_authenticated_user_receives_own_profile(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::DashboardAccess->value], 'Mínimo');
        $user = $this->createUserForCompany($company, $role, ['email' => 'me@test.local']);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/user/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'me@test.local')
            ->assertJsonStructure(['data' => ['role', 'permissions']]);
    }
}
