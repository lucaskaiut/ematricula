<?php

declare(strict_types=1);

namespace Tests\Feature\Api\ClassGroup;

use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class ClassGroupApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_class_groups_read_required(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::PlansRead->value], 'Outro');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/class-groups')
            ->assertForbidden();
    }

    public function test_class_groups_index_scoped_to_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::ClassGroupsRead->value], 'A');
        $this->createRoleForCompany($companyB, [Permission::ClassGroupsRead->value], 'B');
        $modA = $this->createModality($companyA);
        $teacherA = $this->createTeacherPerson($companyA);
        $cgA = ClassGroup::query()->create([
            'company_id' => $companyA->id,
            'name' => 'Turma A',
            'modality_id' => $modA->id,
            'teacher_person_id' => $teacherA->id,
            'max_capacity' => null,
            'weekdays' => '[1,3]',
            'starts_at' => '08:00:00',
            'ends_at' => '09:00:00',
        ]);
        $modB = $this->createModality($companyB);
        $teacherB = $this->createTeacherPerson($companyB);
        ClassGroup::query()->create([
            'company_id' => $companyB->id,
            'name' => 'Turma B',
            'modality_id' => $modB->id,
            'teacher_person_id' => $teacherB->id,
            'max_capacity' => null,
            'weekdays' => '[2]',
            'starts_at' => '10:00:00',
            'ends_at' => '11:00:00',
        ]);
        $auth = $this->createUserForCompany($companyA, $readA);

        $response = $this->withHeaders($this->bearerHeaders($auth))->getJson('/api/class-groups');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($cgA->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_class_group_show_returns_record_for_same_company(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::ClassGroupsRead->value], 'Leitor');
        $write = $this->createRoleForCompany($company, [Permission::ClassGroupsWrite->value], 'Escritor');
        $authRead = $this->createUserForCompany($company, $read);
        $authWrite = $this->createUserForCompany($company, $write);
        [$cgId] = $this->createClassGroupViaApi($company, $authWrite);

        Sanctum::actingAs($authRead);

        $this->getJson('/api/class-groups/'.$cgId)
            ->assertOk()
            ->assertJsonPath('data.id', $cgId);
    }

    public function test_class_group_show_404_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::ClassGroupsRead->value], 'A');
        $modB = $this->createModality($companyB);
        $teacherB = $this->createTeacherPerson($companyB);
        $foreign = ClassGroup::query()->create([
            'company_id' => $companyB->id,
            'name' => 'Externa',
            'modality_id' => $modB->id,
            'teacher_person_id' => $teacherB->id,
            'max_capacity' => null,
            'weekdays' => '[1]',
            'starts_at' => '08:00:00',
            'ends_at' => '09:00:00',
        ]);
        $auth = $this->createUserForCompany($companyA, $readA);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/class-groups/'.$foreign->id)
            ->assertNotFound();
    }

    public function test_class_group_crud_via_api(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [Permission::ClassGroupsWrite->value], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);
        $mod = $this->createModality($company);
        $teacher = $this->createTeacherPerson($company);
        $plan = $this->createPlan($company);

        $create = $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/class-groups', [
                'name' => 'Turma Manhã',
                'modality_id' => $mod->id,
                'teacher_person_id' => $teacher->id,
                'weekdays' => [1, 3, 5],
                'starts_at' => '08:00',
                'ends_at' => '09:30',
                'plan_ids' => [$plan->id],
            ]);

        $create->assertCreated()->assertJsonPath('data.name', 'Turma Manhã');
        $id = $create->json('data.id');

        $this->withHeaders($this->bearerHeaders($auth))
            ->putJson('/api/class-groups/'.$id, [
                'name' => 'Turma Manhã Plus',
                'modality_id' => $mod->id,
                'teacher_person_id' => $teacher->id,
                'weekdays' => [1, 3],
                'starts_at' => '08:00',
                'ends_at' => '09:00',
                'plan_ids' => [$plan->id],
            ])
            ->assertOk();

        $this->withHeaders($this->bearerHeaders($auth))
            ->patchJson('/api/class-groups/'.$id, [
                'name' => 'Turma Patch',
                'modality_id' => $mod->id,
                'teacher_person_id' => $teacher->id,
                'weekdays' => [2],
                'starts_at' => '14:00',
                'ends_at' => '15:00',
                'plan_ids' => [$plan->id],
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Turma Patch');

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/class-groups/'.$id)
            ->assertNoContent();

        $this->assertDatabaseMissing('class_groups', ['id' => $id]);
    }

    public function test_class_groups_index_filter_by_modality_id(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::ClassGroupsRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $m1 = $this->createModality($company, 'M1');
        $m2 = $this->createModality($company, 'M2');
        $t = $this->createTeacherPerson($company);
        $cg1 = ClassGroup::query()->create([
            'company_id' => $company->id,
            'name' => 'TG1',
            'modality_id' => $m1->id,
            'teacher_person_id' => $t->id,
            'max_capacity' => null,
            'weekdays' => '[1]',
            'starts_at' => '08:00:00',
            'ends_at' => '09:00:00',
        ]);
        ClassGroup::query()->create([
            'company_id' => $company->id,
            'name' => 'TG2',
            'modality_id' => $m2->id,
            'teacher_person_id' => $t->id,
            'max_capacity' => null,
            'weekdays' => '[2]',
            'starts_at' => '10:00:00',
            'ends_at' => '11:00:00',
        ]);

        $response = $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/class-groups?'.http_build_query([
                'filters' => ['modality_id' => $m1->id],
            ]));

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertSame([$cg1->id], $ids);
    }
}
