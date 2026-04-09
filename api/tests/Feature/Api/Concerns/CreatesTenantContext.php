<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Concerns;

use App\Models\User;
use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Acl\Domain\Models\Role;
use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Company\Domain\Models\Company;
use App\Modules\Modality\Domain\Models\Modality;
use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Enums\PersonStatus;
use App\Modules\Person\Domain\Models\Person;
use App\Modules\Plan\Domain\Enums\BillingCycle;
use App\Modules\Plan\Domain\Models\Plan;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

trait CreatesTenantContext
{
    private int $companySequence = 0;

    protected function createCompany(?string $name = null, ?string $email = null): Company
    {
        $this->companySequence++;

        return Company::query()->create([
            'name' => $name ?? 'Empresa '.$this->companySequence,
            'email' => $email ?? 'empresa'.$this->companySequence.'@test.local',
            'phone' => '0000000000',
        ]);
    }

    /**
     * @param  list<string>  $permissionValues
     */
    protected function createRoleForCompany(Company $company, array $permissionValues, string $name = 'Papel'): Role
    {
        return Role::query()->withoutGlobalScopes()->create([
            'company_id' => $company->id,
            'name' => $name.' '.Str::uuid()->toString(),
            'description' => null,
            'permissions' => $permissionValues,
        ]);
    }

    protected function createRoleWithAllPermissions(Company $company, string $name = 'Admin'): Role
    {
        $all = array_map(static fn (Permission $p) => $p->value, Permission::cases());

        return $this->createRoleForCompany($company, $all, $name);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    protected function createUserForCompany(Company $company, Role $role, array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'company_id' => $company->id,
            'role_id' => $role->id,
        ], $overrides));
    }

    /**
     * @return array<string, string>
     */
    protected function bearerHeaders(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken];
    }

    protected function createTeacherPerson(Company $company): Person
    {
        $suffix = Str::uuid()->toString();

        return Person::query()->create([
            'company_id' => $company->id,
            'full_name' => 'Professor '.$suffix,
            'birth_date' => '1990-05-10',
            'cpf' => null,
            'phone' => '11988887777',
            'email' => 'teacher_'.$suffix.'@test.local',
            'guardian_person_id' => null,
            'status' => PersonStatus::Active,
            'notes' => null,
            'profile' => PersonProfile::Teacher,
        ]);
    }

    protected function createMinorStudentPerson(Company $company, Person $guardian): Person
    {
        $suffix = Str::uuid()->toString();

        return Person::query()->create([
            'company_id' => $company->id,
            'full_name' => 'Aluno '.$suffix,
            'birth_date' => '2015-03-15',
            'cpf' => null,
            'phone' => '11977776666',
            'email' => 'student_'.$suffix.'@test.local',
            'guardian_person_id' => $guardian->id,
            'status' => PersonStatus::Active,
            'notes' => null,
            'profile' => PersonProfile::Student,
        ]);
    }

    protected function createAdultStudentPerson(Company $company): Person
    {
        $suffix = Str::uuid()->toString();

        return Person::query()->create([
            'company_id' => $company->id,
            'full_name' => 'Aluno maior '.$suffix,
            'birth_date' => '2000-07-01',
            'cpf' => null,
            'phone' => '11977776666',
            'email' => 'adult_student_'.$suffix.'@test.local',
            'guardian_person_id' => null,
            'status' => PersonStatus::Active,
            'notes' => null,
            'profile' => PersonProfile::Student,
        ]);
    }

    protected function createModality(Company $company, ?string $name = null): Modality
    {
        return Modality::query()->create([
            'company_id' => $company->id,
            'name' => $name ?? 'Modalidade '.Str::uuid()->toString(),
            'description' => null,
        ]);
    }

    protected function createPlan(Company $company, ?string $name = null): Plan
    {
        return Plan::query()->create([
            'company_id' => $company->id,
            'name' => $name ?? 'Plano '.Str::uuid()->toString(),
            'price' => '99.90',
            'billing_cycle' => BillingCycle::Month,
            'billing_interval' => 1,
        ]);
    }

    protected function attachPlanToClassGroup(ClassGroup $classGroup, Plan $plan): void
    {
        $classGroup->plans()->syncWithoutDetaching([$plan->id]);
    }

    /**
     * @return array{0: int, 1: Plan}
     */
    protected function createClassGroupViaApi(Company $company, User $actingUser): array
    {
        Sanctum::actingAs($actingUser);

        $mod = $this->createModality($company);
        $teacher = $this->createTeacherPerson($company);
        $plan = $this->createPlan($company);

        $res = $this->postJson('/api/class-groups', [
            'name' => 'Turma '.Str::uuid()->toString(),
            'modality_id' => $mod->id,
            'teacher_person_id' => $teacher->id,
            'weekdays' => [1, 2],
            'starts_at' => '09:00',
            'ends_at' => '10:00',
            'plan_ids' => [$plan->id],
        ]);

        $res->assertCreated();

        return [(int) $res->json('data.id'), $plan];
    }

    protected function createAdultGuardianPerson(Company $company): Person
    {
        $suffix = Str::uuid()->toString();

        return Person::query()->create([
            'company_id' => $company->id,
            'full_name' => 'Responsável '.$suffix,
            'birth_date' => '1982-06-20',
            'cpf' => null,
            'phone' => '11966665555',
            'email' => 'guardian_'.$suffix.'@test.local',
            'guardian_person_id' => null,
            'status' => PersonStatus::Active,
            'notes' => null,
            'profile' => PersonProfile::Teacher,
        ]);
    }
}
