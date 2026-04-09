<?php

declare(strict_types=1);

namespace Tests\Feature\Api\User;

use App\Modules\Acl\Domain\Enums\Permission;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class UserIndexTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_guest_cannot_list_users(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
    }

    public function test_user_without_users_read_cannot_list_users(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::PlansRead->value], 'Sem usuários');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/users')
            ->assertForbidden();
    }

    public function test_authenticated_user_lists_only_users_from_own_company(): void
    {
        $companyA = $this->createCompany('Empresa A', 'a@example.org');
        $companyB = $this->createCompany('Empresa B', 'b@example.org');

        $roleA = $this->createRoleForCompany($companyA, [Permission::UsersRead->value], 'Leitor A');
        $roleB = $this->createRoleForCompany($companyB, [Permission::UsersRead->value], 'Leitor B');

        $authUser = $this->createUserForCompany($companyA, $roleA);
        $colleague = $this->createUserForCompany($companyA, $roleA);
        $this->createUserForCompany($companyB, $roleB);

        $response = $this->withHeaders($this->bearerHeaders($authUser))
            ->getJson('/api/users');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'email', 'role', 'permissions', 'created_at', 'updated_at'],
                ],
                'links',
                'meta',
            ])
            ->assertJsonCount(2, 'data');

        $this->assertEqualsCanonicalizing(
            [$authUser->id, $colleague->id],
            collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all()
        );
    }

    public function test_users_index_supports_filters_and_order_by(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Leitor');
        $user = $this->createUserForCompany($company, $role, ['name' => 'Zebra User', 'email' => 'zebra@test.local']);
        $this->createUserForCompany($company, $role, ['name' => 'Alpha User', 'email' => 'alpha@test.local']);

        $response = $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/users?'.http_build_query([
                'filters' => ['name' => ['like', '%Alpha%']],
                'orderBy' => ['name' => 'asc'],
                'per_page' => 10,
            ]));

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertContains('Alpha User', $names);
        $this->assertNotContains('Zebra User', $names);
    }
}
