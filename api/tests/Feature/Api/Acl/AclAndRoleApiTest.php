<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Acl;

use App\Modules\Acl\Domain\Enums\Permission;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class AclAndRoleApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_guest_cannot_list_permissions(): void
    {
        $this->getJson('/api/acl/permissions')->assertUnauthorized();
    }

    public function test_acl_permissions_requires_roles_read_or_write(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Sem perfil');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/acl/permissions')
            ->assertForbidden();
    }

    public function test_acl_permissions_with_roles_read_returns_definitions(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::RolesRead->value], 'Leitor');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/acl/permissions')
            ->assertOk()
            ->assertJsonStructure(['data' => [['key', 'label', 'category']]]);
    }

    public function test_acl_permissions_with_roles_write_without_read(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::RolesWrite->value], 'Escritor');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/acl/permissions')
            ->assertOk();
    }

    public function test_roles_index_requires_roles_read(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::RolesWrite->value], 'Só escrita');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/roles')
            ->assertForbidden();
    }

    public function test_roles_index_lists_only_same_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $roleReadA = $this->createRoleForCompany($companyA, [Permission::RolesRead->value], 'Leitor A');
        $roleReadB = $this->createRoleForCompany($companyB, [Permission::RolesRead->value], 'Leitor B');
        $this->createRoleForCompany($companyA, [Permission::UsersRead->value], 'Papel A1');
        $this->createRoleForCompany($companyB, [Permission::UsersRead->value], 'Papel B1');
        $auth = $this->createUserForCompany($companyA, $roleReadA);

        $response = $this->withHeaders($this->bearerHeaders($auth))->getJson('/api/roles');

        $response->assertOk();
        $companyIds = collect($response->json('data'))->pluck('company_id')->unique()->values()->all();
        $this->assertSame([$companyA->id], $companyIds);
    }

    public function test_roles_show_returns_record_for_same_company(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::RolesRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $target = $this->createRoleForCompany($company, [Permission::PlansRead->value], 'Alvo');

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/roles/'.$target->id)
            ->assertOk()
            ->assertJsonPath('data.id', $target->id);
    }

    public function test_roles_show_returns_404_for_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $roleReadA = $this->createRoleForCompany($companyA, [Permission::RolesRead->value], 'Leitor A');
        $foreign = $this->createRoleForCompany($companyB, [Permission::UsersRead->value], 'Externo');
        $auth = $this->createUserForCompany($companyA, $roleReadA);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/roles/'.$foreign->id)
            ->assertNotFound();
    }

    public function test_roles_write_required_for_store(): void
    {
        $company = $this->createCompany();
        $roleRead = $this->createRoleForCompany($company, [Permission::RolesRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $roleRead);

        $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/roles', [
                'name' => 'Novo perfil',
                'permissions' => [Permission::UsersRead->value],
            ])
            ->assertForbidden();
    }

    public function test_roles_store_and_update_and_delete(): void
    {
        $company = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($company, [Permission::RolesWrite->value], 'Escritor');
        $auth = $this->createUserForCompany($company, $roleWrite);

        $create = $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/roles', [
                'name' => 'Financeiro',
                'description' => 'Teste',
                'permissions' => [Permission::InvoicesRead->value],
            ]);

        $create->assertCreated()->assertJsonPath('data.name', 'Financeiro');
        $id = $create->json('data.id');

        $this->withHeaders($this->bearerHeaders($auth))
            ->putJson('/api/roles/'.$id, [
                'name' => 'Financeiro Plus',
                'description' => 'Atualizado',
                'permissions' => [Permission::InvoicesRead->value, Permission::InvoicesWrite->value],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Financeiro Plus');

        $this->withHeaders($this->bearerHeaders($auth))
            ->patchJson('/api/roles/'.$id, [
                'name' => 'Financeiro Patch',
                'permissions' => [Permission::InvoicesRead->value],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Financeiro Patch');

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/roles/'.$id)
            ->assertNoContent();

        $this->assertDatabaseMissing('roles', ['id' => $id]);
    }

    public function test_roles_delete_with_assigned_users_returns_422(): void
    {
        $company = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($company, [Permission::RolesWrite->value], 'Escritor');
        $roleVictim = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Vítima');
        $auth = $this->createUserForCompany($company, $roleWrite);
        $this->createUserForCompany($company, $roleVictim);

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/roles/'.$roleVictim->id)
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Não é possível excluir um perfil vinculado a usuários.']);
    }

    public function test_roles_index_supports_filters(): void
    {
        $company = $this->createCompany();
        $roleRead = $this->createRoleForCompany($company, [Permission::RolesRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $roleRead);
        $needle = $this->createRoleForCompany($company, [Permission::PlansRead->value], 'Filtro Alfa');
        $this->createRoleForCompany($company, [Permission::PlansRead->value], 'Outro Beta');

        $response = $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/roles?'.http_build_query([
                'filters' => ['name' => ['like', '%Alfa%']],
            ]));

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($needle->id, $ids);
    }
}
