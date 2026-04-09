<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Setting;

use App\Modules\Acl\Domain\Enums\Permission;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class SettingsApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_guest_cannot_list_settings(): void
    {
        $this->getJson('/api/settings')->assertUnauthorized();
    }

    public function test_settings_read_permission_required(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Sem settings');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/settings')
            ->assertForbidden();
    }

    public function test_settings_index_returns_grouped_data(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::SettingsRead->value], 'Leitor');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_settings_write_required_for_update(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::SettingsRead->value], 'Só leitura');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->putJson('/api/settings', [
                'settings' => ['invoice.due_days' => 14],
            ])
            ->assertForbidden();
    }

    public function test_settings_update_persists_valid_key(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [
            Permission::SettingsRead->value,
            Permission::SettingsWrite->value,
        ], 'Config');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->putJson('/api/settings', [
                'settings' => ['invoice.due_days' => 12],
            ])
            ->assertOk();

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonFragment(['key' => 'invoice.due_days']);
    }

    public function test_settings_update_unknown_key_returns_422(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::SettingsWrite->value], 'Escritor');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->putJson('/api/settings', [
                'settings' => ['chave.inexistente' => 'x'],
            ])
            ->assertStatus(422)
            ->assertJsonFragment(['message' => 'Chaves desconhecidas: chave.inexistente']);
    }
}
