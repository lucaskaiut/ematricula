<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Person;

use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Enums\PersonStatus;
use Carbon\Carbon;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class PersonApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_persons_read_required_for_index(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::ModalitiesRead->value], 'Outro');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/persons')
            ->assertForbidden();
    }

    public function test_persons_index_scoped_to_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::PersonsRead->value], 'A');
        $this->createRoleForCompany($companyB, [Permission::PersonsRead->value], 'B');
        $pA = $this->createTeacherPerson($companyA);
        $this->createTeacherPerson($companyB);
        $auth = $this->createUserForCompany($companyA, $readA);

        $response = $this->withHeaders($this->bearerHeaders($auth))->getJson('/api/persons');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($pA->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_person_show_returns_record_for_same_company(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::PersonsRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $person = $this->createTeacherPerson($company);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/persons/'.$person->id)
            ->assertOk()
            ->assertJsonPath('data.id', $person->id);
    }

    public function test_person_show_404_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::PersonsRead->value], 'A');
        $foreign = $this->createTeacherPerson($companyB);
        $auth = $this->createUserForCompany($companyA, $readA);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/persons/'.$foreign->id)
            ->assertNotFound();
    }

    public function test_persons_filter_modality_ids_requires_all_modalities(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::PersonsRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $m1 = $this->createModality($company, 'M1');
        $m2 = $this->createModality($company, 'M2');
        $t1 = $this->createTeacherPerson($company);
        $t1->modalities()->sync([$m1->id]);
        $t2 = $this->createTeacherPerson($company);
        $t2->modalities()->sync([$m1->id, $m2->id]);

        $query = http_build_query([
            'filters' => [
                'modality_ids' => [$m1->id, $m2->id],
            ],
        ]);

        $response = $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/persons?'.$query);

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertSame([$t2->id], $ids);
    }

    public function test_persons_filter_eligible_as_guardian(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::PersonsRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $adult = $this->createAdultStudentPerson($company);
        $adult->forceFill(['birth_date' => Carbon::today()->subYears(19)])->saveQuietly();
        $minor = $this->createAdultStudentPerson($company);
        $minor->forceFill(['birth_date' => Carbon::today()->subYears(10)])->saveQuietly();

        $response = $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/persons?'.http_build_query([
                'filters' => ['eligible_as_guardian' => true],
            ]));

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($adult->id, $ids);
        $this->assertNotContains($minor->id, $ids);
    }

    public function test_person_write_creates_teacher_and_student(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [Permission::PersonsWrite->value], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);
        $mod = $this->createModality($company);

        $teacher = $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/persons', [
                'full_name' => 'Prof API',
                'birth_date' => '1991-04-01',
                'cpf' => null,
                'phone' => '11988881234',
                'email' => 'prof_api@test.local',
                'guardian_person_id' => null,
                'status' => PersonStatus::Active->value,
                'notes' => null,
                'profile' => PersonProfile::Teacher->value,
                'modality_ids' => [$mod->id],
            ]);

        $teacher->assertCreated()->assertJsonPath('data.profile', PersonProfile::Teacher->value);

        $guardian = $this->createAdultGuardianPerson($company);

        $student = $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/persons', [
                'full_name' => 'Aluno Menor API',
                'birth_date' => '2016-01-10',
                'cpf' => null,
                'phone' => '11988885678',
                'email' => 'aluno_menor@test.local',
                'guardian_person_id' => $guardian->id,
                'status' => PersonStatus::Active->value,
                'notes' => null,
                'profile' => PersonProfile::Student->value,
            ]);

        $student->assertCreated()->assertJsonPath('data.profile', PersonProfile::Student->value);
    }

    public function test_person_update_and_delete(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [Permission::PersonsWrite->value], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);
        $p = $this->createTeacherPerson($company);

        $this->withHeaders($this->bearerHeaders($auth))
            ->putJson('/api/persons/'.$p->id, [
                'full_name' => 'Nome Atualizado',
                'birth_date' => '1990-01-01',
                'cpf' => null,
                'phone' => '11977771234',
                'email' => $p->email,
                'guardian_person_id' => null,
                'status' => PersonStatus::Inactive->value,
                'notes' => null,
                'profile' => PersonProfile::Teacher->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.full_name', 'Nome Atualizado');

        $this->withHeaders($this->bearerHeaders($auth))
            ->patchJson('/api/persons/'.$p->id, [
                'full_name' => 'Nome Patch',
                'birth_date' => '1990-01-01',
                'cpf' => null,
                'phone' => '11977771234',
                'email' => $p->email,
                'guardian_person_id' => null,
                'status' => PersonStatus::Active->value,
                'notes' => null,
                'profile' => PersonProfile::Teacher->value,
            ])
            ->assertOk();

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/persons/'.$p->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('people', ['id' => $p->id]);
    }
}
