<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Modality;

use App\Modules\Acl\Domain\Enums\Permission;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class ModalityApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_modalities_read_required_for_index(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::UsersRead->value], 'Sem modalidade');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/modalities')
            ->assertForbidden();
    }

    public function test_modalities_index_scoped_to_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::ModalitiesRead->value], 'A');
        $readB = $this->createRoleForCompany($companyB, [Permission::ModalitiesRead->value], 'B');
        $mA = $this->createModality($companyA, 'Modalidade A');
        $this->createModality($companyB, 'Modalidade B');
        $auth = $this->createUserForCompany($companyA, $readA);

        $response = $this->withHeaders($this->bearerHeaders($auth))->getJson('/api/modalities');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($mA->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_modality_show_returns_record_for_same_company(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::ModalitiesRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $mod = $this->createModality($company, 'Karate');

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/modalities/'.$mod->id)
            ->assertOk()
            ->assertJsonPath('data.id', $mod->id);
    }

    public function test_modality_show_404_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::ModalitiesRead->value], 'A');
        $foreign = $this->createModality($companyB);
        $auth = $this->createUserForCompany($companyA, $readA);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/modalities/'.$foreign->id)
            ->assertNotFound();
    }

    public function test_modality_crud_with_write_permission(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [Permission::ModalitiesWrite->value], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);

        $create = $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/modalities', [
                'name' => 'Judô',
                'description' => 'Arte marcial',
            ]);

        $create->assertCreated()->assertJsonPath('data.name', 'Judô');
        $id = $create->json('data.id');

        $this->withHeaders($this->bearerHeaders($auth))
            ->putJson('/api/modalities/'.$id, [
                'name' => 'Judô Competitivo',
                'description' => null,
            ])
            ->assertOk();

        $this->withHeaders($this->bearerHeaders($auth))
            ->patchJson('/api/modalities/'.$id, [
                'name' => 'Judô Patch',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Judô Patch');

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/modalities/'.$id)
            ->assertNoContent();

        $this->assertDatabaseMissing('modalities', ['id' => $id]);
    }

    public function test_modalities_index_order_by_name(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::ModalitiesRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $this->createModality($company, 'Zebra');
        $this->createModality($company, 'Alpha');

        $response = $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/modalities?'.http_build_query([
                'orderBy' => ['name' => 'asc'],
            ]));

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $sorted = $names;
        sort($sorted);
        $this->assertSame($sorted, $names);
    }
}
