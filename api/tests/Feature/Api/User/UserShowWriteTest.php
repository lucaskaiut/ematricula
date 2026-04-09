<?php

declare(strict_types=1);

namespace Tests\Feature\Api\User;

use App\Modules\Acl\Domain\Enums\Permission;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class UserShowWriteTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_guest_cannot_show_user(): void
    {
        $this->getJson('/api/users/1')->assertUnauthorized();
    }

    public function test_users_read_required_for_show(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::UsersWrite->value], 'Só escrita');
        $user = $this->createUserForCompany($company, $role);
        $target = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/users/'.$target->id)
            ->assertForbidden();
    }

    public function test_show_returns_user_from_same_company_only(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $roleA = $this->createRoleForCompany($companyA, [Permission::UsersRead->value], 'A');
        $roleB = $this->createRoleForCompany($companyB, [Permission::UsersRead->value], 'B');
        $auth = $this->createUserForCompany($companyA, $roleA);
        $foreign = $this->createUserForCompany($companyB, $roleB);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/users/'.$foreign->id)
            ->assertNotFound();
    }

    public function test_show_returns_user_when_same_tenant(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $role);
        $other = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/users/'.$other->id)
            ->assertOk()
            ->assertJsonPath('data.id', $other->id);
    }

    public function test_users_write_required_for_store(): void
    {
        $company = $this->createCompany();
        $roleRead = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Leitor');
        $roleTarget = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Alvo');
        $auth = $this->createUserForCompany($company, $roleRead);

        $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/users', [
                'name' => 'Novo',
                'email' => 'novo@test.local',
                'role_id' => $roleTarget->id,
                'password' => 'senha1234',
            ])
            ->assertForbidden();
    }

    public function test_store_creates_user_in_same_company(): void
    {
        $company = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($company, [Permission::UsersWrite->value], 'Escritor');
        $roleNew = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Novo papel');
        $auth = $this->createUserForCompany($company, $roleWrite);

        $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/users', [
                'name' => 'Usuário novo',
                'email' => 'criado@test.local',
                'role_id' => $roleNew->id,
                'password' => 'senha1234',
            ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'criado@test.local');

        $this->assertDatabaseHas('users', [
            'email' => 'criado@test.local',
            'company_id' => $company->id,
            'role_id' => $roleNew->id,
        ]);
    }

    public function test_store_rejects_role_from_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($companyA, [Permission::UsersWrite->value], 'Escritor');
        $foreignRole = $this->createRoleForCompany($companyB, [Permission::UsersRead->value], 'Externo');
        $auth = $this->createUserForCompany($companyA, $roleWrite);

        $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/users', [
                'name' => 'Novo',
                'email' => 'x@test.local',
                'role_id' => $foreignRole->id,
                'password' => 'senha1234',
            ])
            ->assertUnprocessable();
    }

    public function test_update_via_put_changes_user(): void
    {
        $company = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($company, [Permission::UsersWrite->value], 'Escritor');
        $roleB = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'B');
        $auth = $this->createUserForCompany($company, $roleWrite);
        $target = $this->createUserForCompany($company, $roleB, ['name' => 'Antigo', 'email' => 'alvo@test.local']);

        $this->withHeaders($this->bearerHeaders($auth))
            ->putJson('/api/users/'.$target->id, [
                'name' => 'Atualizado',
                'email' => 'alvo@test.local',
                'role_id' => $roleB->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Atualizado');
    }

    public function test_update_via_patch_is_allowed(): void
    {
        $company = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($company, [Permission::UsersWrite->value], 'Escritor');
        $roleB = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'B');
        $auth = $this->createUserForCompany($company, $roleWrite);
        $target = $this->createUserForCompany($company, $roleB, ['email' => 'patch@test.local']);

        $this->withHeaders($this->bearerHeaders($auth))
            ->patchJson('/api/users/'.$target->id, [
                'name' => 'Só nome',
                'email' => 'patch@test.local',
                'role_id' => $roleB->id,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Só nome');
    }

    public function test_cannot_update_user_from_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($companyA, [Permission::UsersWrite->value], 'Escritor');
        $roleInA = $this->createRoleForCompany($companyA, [Permission::UsersRead->value], 'Papel A');
        $roleB = $this->createRoleForCompany($companyB, [Permission::UsersRead->value], 'B');
        $auth = $this->createUserForCompany($companyA, $roleWrite);
        $foreign = $this->createUserForCompany($companyB, $roleB);

        $this->withHeaders($this->bearerHeaders($auth))
            ->putJson('/api/users/'.$foreign->id, [
                'name' => 'X',
                'email' => 'foreign@test.local',
                'role_id' => $roleInA->id,
            ])
            ->assertNotFound();
    }

    public function test_delete_removes_user_from_same_company(): void
    {
        $company = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($company, [Permission::UsersWrite->value], 'Escritor');
        $roleVictim = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Vítima');
        $auth = $this->createUserForCompany($company, $roleWrite);
        $victim = $this->createUserForCompany($company, $roleVictim);

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/users/'.$victim->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $victim->id]);
    }

    public function test_delete_returns_404_for_foreign_company_user(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $roleWrite = $this->createRoleForCompany($companyA, [Permission::UsersWrite->value], 'Escritor');
        $roleB = $this->createRoleForCompany($companyB, [Permission::UsersRead->value], 'B');
        $auth = $this->createUserForCompany($companyA, $roleWrite);
        $foreign = $this->createUserForCompany($companyB, $roleB);

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/users/'.$foreign->id)
            ->assertNotFound();
    }
}
