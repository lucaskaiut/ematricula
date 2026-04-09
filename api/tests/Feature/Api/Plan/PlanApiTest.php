<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Plan;

use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Plan\Domain\Enums\BillingCycle;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class PlanApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_plans_read_required_for_index(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::ModalitiesRead->value], 'Outro');
        $user = $this->createUserForCompany($company, $role);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/plans')
            ->assertForbidden();
    }

    public function test_plans_index_scoped_to_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::PlansRead->value], 'A');
        $this->createRoleForCompany($companyB, [Permission::PlansRead->value], 'B');
        $planA = $this->createPlan($companyA, 'Plano A');
        $this->createPlan($companyB, 'Plano B');
        $auth = $this->createUserForCompany($companyA, $readA);

        $response = $this->withHeaders($this->bearerHeaders($auth))->getJson('/api/plans');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($planA->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_plan_show_returns_record_for_same_company(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::PlansRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $plan = $this->createPlan($company, 'Plano Show');

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/plans/'.$plan->id)
            ->assertOk()
            ->assertJsonPath('data.id', $plan->id);
    }

    public function test_plan_show_404_other_company(): void
    {
        $companyA = $this->createCompany();
        $companyB = $this->createCompany();
        $readA = $this->createRoleForCompany($companyA, [Permission::PlansRead->value], 'A');
        $foreign = $this->createPlan($companyB);
        $auth = $this->createUserForCompany($companyA, $readA);

        $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/plans/'.$foreign->id)
            ->assertNotFound();
    }

    public function test_plan_crud_with_write_permission(): void
    {
        $company = $this->createCompany();
        $write = $this->createRoleForCompany($company, [Permission::PlansWrite->value], 'Escritor');
        $auth = $this->createUserForCompany($company, $write);

        $create = $this->withHeaders($this->bearerHeaders($auth))
            ->postJson('/api/plans', [
                'name' => 'Mensal Básico',
                'price' => 150.5,
                'billing_cycle' => BillingCycle::Month->value,
                'billing_interval' => 1,
            ]);

        $create->assertCreated()->assertJsonPath('data.name', 'Mensal Básico');
        $id = $create->json('data.id');

        $this->withHeaders($this->bearerHeaders($auth))
            ->putJson('/api/plans/'.$id, [
                'name' => 'Mensal Plus',
                'price' => 200,
                'billing_cycle' => BillingCycle::Month->value,
                'billing_interval' => 1,
            ])
            ->assertOk();

        $this->withHeaders($this->bearerHeaders($auth))
            ->patchJson('/api/plans/'.$id, [
                'name' => 'Mensal Patch',
                'price' => 175,
                'billing_cycle' => BillingCycle::Month->value,
                'billing_interval' => 1,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Mensal Patch');

        $this->withHeaders($this->bearerHeaders($auth))
            ->deleteJson('/api/plans/'.$id)
            ->assertNoContent();

        $this->assertDatabaseMissing('plans', ['id' => $id]);
    }

    public function test_plans_index_filter_by_price(): void
    {
        $company = $this->createCompany();
        $read = $this->createRoleForCompany($company, [Permission::PlansRead->value], 'Leitor');
        $auth = $this->createUserForCompany($company, $read);
        $this->createPlan($company, 'Barato');
        $expensive = $this->createPlan($company, 'Caro');
        $expensive->forceFill(['price' => 500])->saveQuietly();

        $response = $this->withHeaders($this->bearerHeaders($auth))
            ->getJson('/api/plans?'.http_build_query([
                'filters' => ['price' => ['>=', 400]],
            ]));

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($expensive->id, $ids);
    }
}
