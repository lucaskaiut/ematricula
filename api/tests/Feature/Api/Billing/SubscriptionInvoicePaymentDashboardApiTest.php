<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Billing;

use App\Models\User;
use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Company\Domain\Models\Company;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Payment\Domain\Models\Payment;
use App\Modules\Subscription\Domain\Models\Subscription;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class SubscriptionInvoicePaymentDashboardApiTest extends ApiTestCase
{
    use CreatesTenantContext;

    /**
     * @return array{company: Company, user: User, enrollmentId: int, subscriptionId: int, invoiceId: int}
     */
    private function companyWithEnrollmentAndInvoice(): array
    {
        $company = $this->createCompany();
        $user = $this->createUserForCompany($company, $this->createRoleWithAllPermissions($company));
        [$cgId, $plan] = $this->createClassGroupViaApi($company, $user);
        $student = $this->createAdultStudentPerson($company);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($user);

        $enrollment = $this->postJson('/api/enrollments', [
            'student_person_id' => $student->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $enrollment->assertCreated();
        $enrollmentId = (int) $enrollment->json('data.id');

        $subscription = Subscription::query()->where('enrollment_id', $enrollmentId)->firstOrFail();
        $invoice = Invoice::query()->where('subscription_id', $subscription->id)->firstOrFail();

        return [
            'company' => $company,
            'user' => $user,
            'enrollmentId' => $enrollmentId,
            'subscriptionId' => (int) $subscription->id,
            'invoiceId' => (int) $invoice->id,
        ];
    }

    public function test_subscriptions_read_required(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::InvoicesRead->value], 'Outro');
        $user = $this->createUserForCompany($company, $role);
        Sanctum::actingAs($user);

        $this->getJson('/api/subscriptions')->assertForbidden();
    }

    public function test_subscriptions_index_scoped_to_company(): void
    {
        $ctxA = $this->companyWithEnrollmentAndInvoice();
        $ctxB = $this->companyWithEnrollmentAndInvoice();
        $readA = $this->createRoleForCompany($ctxA['company'], [Permission::SubscriptionsRead->value], 'Leitor');
        $reader = $this->createUserForCompany($ctxA['company'], $readA);

        Sanctum::actingAs($reader);

        $response = $this->getJson('/api/subscriptions');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id')->map(fn ($id) => (int) $id)->all();
        $this->assertContains($ctxA['subscriptionId'], $ids);
        $this->assertNotContains($ctxB['subscriptionId'], $ids);
    }

    public function test_subscription_show_returns_record_for_same_company(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $read = $this->createRoleForCompany($ctx['company'], [Permission::SubscriptionsRead->value], 'Leitor');
        $reader = $this->createUserForCompany($ctx['company'], $read);

        Sanctum::actingAs($reader);

        $this->getJson('/api/subscriptions/'.$ctx['subscriptionId'])
            ->assertOk()
            ->assertJsonPath('data.id', $ctx['subscriptionId']);
    }

    public function test_subscription_show_404_other_company(): void
    {
        $ctxA = $this->companyWithEnrollmentAndInvoice();
        $ctxB = $this->companyWithEnrollmentAndInvoice();
        $readA = $this->createRoleForCompany($ctxA['company'], [Permission::SubscriptionsRead->value], 'Leitor');
        $reader = $this->createUserForCompany($ctxA['company'], $readA);

        Sanctum::actingAs($reader);

        $this->getJson('/api/subscriptions/'.$ctxB['subscriptionId'])->assertNotFound();
    }

    public function test_subscription_cancel_via_put_and_patch(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $write = $this->createRoleForCompany($ctx['company'], [Permission::SubscriptionsWrite->value], 'Escritor');
        $user = $this->createUserForCompany($ctx['company'], $write);

        Sanctum::actingAs($user);

        $this->putJson('/api/subscriptions/'.$ctx['subscriptionId'], [
            'status' => 'canceled',
        ])->assertOk()->assertJsonPath('data.status', 'canceled');

        $ctx2 = $this->companyWithEnrollmentAndInvoice();
        $write2 = $this->createRoleForCompany($ctx2['company'], [Permission::SubscriptionsWrite->value], 'Esc2');
        $user2 = $this->createUserForCompany($ctx2['company'], $write2);
        Sanctum::actingAs($user2);

        $this->patchJson('/api/subscriptions/'.$ctx2['subscriptionId'], [
            'status' => 'canceled',
        ])->assertOk()->assertJsonPath('data.status', 'canceled');
    }

    public function test_generate_next_invoice_requires_subscriptions_write(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $read = $this->createRoleForCompany($ctx['company'], [Permission::SubscriptionsRead->value], 'Leitor');
        $user = $this->createUserForCompany($ctx['company'], $read);

        Sanctum::actingAs($user);

        $this->postJson('/api/subscriptions/'.$ctx['subscriptionId'].'/generate-next-invoice')
            ->assertForbidden();
    }

    public function test_generate_next_invoice_creates_cycle_for_active_subscription(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $write = $this->createRoleForCompany($ctx['company'], [Permission::SubscriptionsWrite->value], 'Escritor');
        $user = $this->createUserForCompany($ctx['company'], $write);

        Sanctum::actingAs($user);

        $before = Invoice::query()->where('subscription_id', $ctx['subscriptionId'])->count();

        $this->postJson('/api/subscriptions/'.$ctx['subscriptionId'].'/generate-next-invoice')
            ->assertOk();

        $after = Invoice::query()->where('subscription_id', $ctx['subscriptionId'])->count();
        $this->assertGreaterThan($before, $after);
    }

    public function test_invoice_show_returns_record_for_same_company(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $read = $this->createRoleForCompany($ctx['company'], [Permission::InvoicesRead->value], 'Leitor');
        $reader = $this->createUserForCompany($ctx['company'], $read);

        Sanctum::actingAs($reader);

        $this->getJson('/api/invoices/'.$ctx['invoiceId'])
            ->assertOk()
            ->assertJsonPath('data.id', $ctx['invoiceId']);
    }

    public function test_invoices_read_required(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::SubscriptionsRead->value], 'Outro');
        $user = $this->createUserForCompany($company, $role);
        Sanctum::actingAs($user);

        $this->getJson('/api/invoices')->assertForbidden();
    }

    public function test_invoices_filter_by_enrollment_id(): void
    {
        $ctx1 = $this->companyWithEnrollmentAndInvoice();
        $user = $this->createUserForCompany($ctx1['company'], $this->createRoleWithAllPermissions($ctx1['company']));
        [$cgId, $plan] = $this->createClassGroupViaApi($ctx1['company'], $user);
        $student2 = $this->createAdultStudentPerson($ctx1['company']);
        $today = Carbon::today()->format('Y-m-d');

        Sanctum::actingAs($user);

        $e2 = $this->postJson('/api/enrollments', [
            'student_person_id' => $student2->id,
            'class_group_id' => $cgId,
            'starts_on' => $today,
            'ends_on' => null,
            'status' => EnrollmentStatus::Active->value,
            'plan_id' => $plan->id,
            'billing_starts_on' => $today,
        ]);
        $e2->assertCreated();
        $enrollment2Id = (int) $e2->json('data.id');

        $read = $this->createRoleForCompany($ctx1['company'], [Permission::InvoicesRead->value], 'Leitor');
        $reader = $this->createUserForCompany($ctx1['company'], $read);
        Sanctum::actingAs($reader);

        $response = $this->getJson('/api/invoices?'.http_build_query([
            'filters' => ['enrollment_id' => $enrollment2Id],
        ]));

        $response->assertOk();
        foreach ($response->json('data') as $row) {
            $this->assertSame($enrollment2Id, (int) $row['subscription']['enrollment_id']);
        }
    }

    public function test_invoice_mark_paid_via_put_and_patch(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $write = $this->createRoleForCompany($ctx['company'], [Permission::InvoicesWrite->value], 'Escritor');
        $user = $this->createUserForCompany($ctx['company'], $write);

        Sanctum::actingAs($user);

        $this->putJson('/api/invoices/'.$ctx['invoiceId'], [
            'status' => 'paid',
        ])->assertOk()->assertJsonPath('data.status', 'paid');

        $ctx2 = $this->companyWithEnrollmentAndInvoice();
        $write2 = $this->createRoleForCompany($ctx2['company'], [Permission::InvoicesWrite->value], 'F2');
        $user2 = $this->createUserForCompany($ctx2['company'], $write2);
        Sanctum::actingAs($user2);
        $inv2 = Invoice::query()->where('company_id', $ctx2['company']->id)->where('status', InvoiceStatus::Pending)->firstOrFail();

        $this->patchJson('/api/invoices/'.$inv2->id, [
            'status' => 'paid',
        ])->assertOk()->assertJsonPath('data.status', 'paid');
    }

    public function test_invoice_payment_store_and_sync_status(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $write = $this->createRoleForCompany($ctx['company'], [Permission::InvoicesWrite->value], 'Fatura');
        $sync = $this->createRoleForCompany($ctx['company'], [Permission::PaymentsSync->value], 'Sync');
        $userPay = $this->createUserForCompany($ctx['company'], $write);
        $userSync = $this->createUserForCompany($ctx['company'], $sync);

        Sanctum::actingAs($userPay);

        $pay = $this->postJson('/api/invoices/'.$ctx['invoiceId'].'/payments');
        $pay->assertCreated();
        $paymentId = (int) $pay->json('data.id');

        Sanctum::actingAs($userSync);

        $this->postJson('/api/payments/'.$paymentId.'/sync-status')->assertOk();

        $payment = Payment::query()->findOrFail($paymentId);
        $this->assertSame('approved', $payment->status->value);
    }

    public function test_payments_sync_forbidden_without_permission(): void
    {
        $ctx = $this->companyWithEnrollmentAndInvoice();
        $write = $this->createRoleForCompany($ctx['company'], [Permission::InvoicesWrite->value], 'Só fatura');
        $user = $this->createUserForCompany($ctx['company'], $write);

        Sanctum::actingAs($user);

        $pay = $this->postJson('/api/invoices/'.$ctx['invoiceId'].'/payments');
        $pay->assertCreated();
        $paymentId = (int) $pay->json('data.id');

        $this->postJson('/api/payments/'.$paymentId.'/sync-status')->assertForbidden();
    }

    public function test_dashboard_summary_requires_permission_and_clamps_days(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::DashboardAccess->value], 'Dash');
        $user = $this->createUserForCompany($company, $role);

        Sanctum::actingAs($user);

        $this->getJson('/api/dashboard/summary?days=0')
            ->assertOk()
            ->assertJsonPath('data.range.days', 1)
            ->assertJsonStructure([
                'data' => [
                    'range' => ['today', 'until', 'days'],
                    'kpis' => ['overdue', 'due_soon', 'paid_this_month'],
                    'lists' => ['upcoming_invoices', 'delinquent_students'],
                ],
            ]);

        $this->getJson('/api/dashboard/summary?days=200')
            ->assertOk()
            ->assertJsonPath('data.range.days', 60);
    }

    public function test_dashboard_forbidden_without_access(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::InvoicesRead->value], 'Sem dash');
        $user = $this->createUserForCompany($company, $role);

        Sanctum::actingAs($user);

        $this->getJson('/api/dashboard/summary')->assertForbidden();
    }
}
