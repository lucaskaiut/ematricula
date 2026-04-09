<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Enrollment;

use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class EnrollmentApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_enrollments_read_required(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::PersonsRead->value], 'Outro');
        $user = $this->createUserForCompany($company, $role);

        Sanctum::actingAs($user);

        $this->getJson('/api/enrollments')->assertForbidden();
    }

    public function test_enrollments_index_scoped_to_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::EnrollmentsRead->value], 'A');
        $writeA = $this->createRoleForCompany($companyA, [
            Permission::EnrollmentsWrite->value,
            Permission::ClassGroupsWrite->value,
        ], 'Escritor A');
        $this->createRoleForCompany($companyB, [Permission::EnrollmentsRead->value], 'B');
        $authA = $this->createUserForCompany($companyA, $readA);
        $setupUser = $this->createUserForCompany($companyA, $writeA);
        [$cgId, $plan] = $this->createClassGroupViaApi($companyA, $setupUser);
        $student = $this->createAdultStudentPerson($companyA);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($setupUser);

        $create = $this->postJson('/api/enrollments', [
            'student_person_id' => $student->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $create->assertCreated();
        $enrollmentId = $create->json('data.id');

        Sanctum::actingAs($authA);

        $response = $this->getJson('/api/enrollments');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($enrollmentId, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_enrollment_show_returns_record_for_same_company(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::EnrollmentsRead->value], 'Leitor');
        $write = $this->createRoleForCompany($company, [
            Permission::EnrollmentsWrite->value,
            Permission::ClassGroupsWrite->value,
        ], 'Escritor');
        $authRead = $this->createUserForCompany($company, $read);
        $authWrite = $this->createUserForCompany($company, $write);
        [$cgId, $plan] = $this->createClassGroupViaApi($company, $authWrite);
        $student = $this->createAdultStudentPerson($company);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($authWrite);

        $created = $this->postJson('/api/enrollments', [
            'student_person_id' => $student->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $id = $created->json('data.id');

        Sanctum::actingAs($authRead);

        $this->getJson('/api/enrollments/'.$id)
            ->assertOk()
            ->assertJsonPath('data.id', $id);
    }

    public function test_enrollment_delete_removes_record(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [
            Permission::EnrollmentsWrite->value,
            Permission::ClassGroupsWrite->value,
        ], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);
        [$cgId, $plan] = $this->createClassGroupViaApi($company, $auth);
        $student = $this->createAdultStudentPerson($company);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($auth);

        $created = $this->postJson('/api/enrollments', [
            'student_person_id' => $student->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $id = $created->json('data.id');

        $this->deleteJson('/api/enrollments/'.$id)->assertNoContent();

        $this->assertDatabaseMissing('enrollments', ['id' => $id]);
    }

    public function test_enrollment_show_404_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::EnrollmentsRead->value], 'A');
        $writeB = $this->createRoleForCompany($companyB, [
            Permission::EnrollmentsWrite->value,
            Permission::ClassGroupsWrite->value,
        ], 'Esc B');
        $authA = $this->createUserForCompany($companyA, $readA);
        $userB = $this->createUserForCompany($companyB, $writeB);
        [$cgId, $plan] = $this->createClassGroupViaApi($companyB, $userB);
        $student = $this->createAdultStudentPerson($companyB);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($userB);

        $foreign = $this->postJson('/api/enrollments', [
            'student_person_id' => $student->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $foreign->assertCreated();

        Sanctum::actingAs($authA);

        $this->getJson('/api/enrollments/'.$foreign->json('data.id'))
            ->assertNotFound();
    }

    public function test_enrollment_create_generates_first_invoice_when_eligible(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [
            Permission::EnrollmentsWrite->value,
            Permission::ClassGroupsWrite->value,
        ], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);
        [$cgId, $plan] = $this->createClassGroupViaApi($company, $auth);
        $student = $this->createAdultStudentPerson($company);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($auth);

        $this->postJson('/api/enrollments', [
            'student_person_id' => $student->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ])->assertCreated();

        $this->assertGreaterThan(0, Invoice::query()->where('company_id', $company->id)->count());
    }

    public function test_enrollment_cancel_cannot_be_reactivated(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [
            Permission::EnrollmentsWrite->value,
            Permission::ClassGroupsWrite->value,
        ], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);
        [$cgId, $plan] = $this->createClassGroupViaApi($company, $auth);
        $student = $this->createAdultStudentPerson($company);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($auth);

        $created = $this->postJson('/api/enrollments', [
            'student_person_id' => $student->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $id = $created->json('data.id');

        $this->putJson('/api/enrollments/'.$id, [
            'status' => EnrollmentStatus::Cancelled->value,
        ])->assertOk();

        $this->patchJson('/api/enrollments/'.$id, [
            'status' => EnrollmentStatus::Active->value,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_enrollments_filter_by_status(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::EnrollmentsRead->value], 'Leitor');
        $write = $this->createRoleForCompany($company, [
            Permission::EnrollmentsWrite->value,
            Permission::ClassGroupsWrite->value,
        ], 'Escritor');
        $authRead = $this->createUserForCompany($company, $read);
        $authWrite = $this->createUserForCompany($company, $write);
        [$cgId, $plan] = $this->createClassGroupViaApi($company, $authWrite);
        $s1 = $this->createAdultStudentPerson($company);
        $s2 = $this->createAdultStudentPerson($company);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($authWrite);

        $this->postJson('/api/enrollments', [
            'student_person_id' => $s1->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ])->assertCreated();

        $locked = $this->postJson('/api/enrollments', [
            'student_person_id' => $s2->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Locked->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $locked->assertCreated();
        $lockedId = $locked->json('data.id');

        Sanctum::actingAs($authRead);

        $response = $this->getJson('/api/enrollments?'.http_build_query([
            'filters' => ['status' => EnrollmentStatus::Locked->value],
        ]));

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertSame([$lockedId], $ids);
    }
}
