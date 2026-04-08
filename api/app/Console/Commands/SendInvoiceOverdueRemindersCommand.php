<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Company\Domain\Runner\CompanyRunner;
use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Notification\Domain\Dtos\OutboundNotification;
use App\Modules\Notification\Domain\Enums\NotificationType;
use App\Modules\Notification\Domain\Services\NotificationHub;
use App\Modules\Payment\Domain\Services\InvoicePaymentMethodResolver;
use App\Modules\Payment\Domain\Services\PaymentService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Throwable;

class SendInvoiceOverdueRemindersCommand extends Command
{
    protected $signature = 'invoices:send-overdue-reminders {--date= : Data de referência Y-m-d (padrão: hoje)}';

    protected $description = 'Envia lembrete por e-mail para faturas pendentes com vencimento anterior à data informada';

    public function handle(
        NotificationHub $hub,
        PaymentService $paymentService,
        InvoicePaymentMethodResolver $invoicePaymentMethodResolver,
    ): int {
        $dateOpt = $this->option('date');
        $today = CarbonImmutable::parse(
            is_string($dateOpt) && $dateOpt !== ''
                ? $dateOpt
                : now()->toDateString()
        )->startOfDay();

        CompanyRunner::forAll(function () use ($hub, $paymentService, $today, $invoicePaymentMethodResolver): void {
            Invoice::query()
                ->where('status', InvoiceStatus::Pending)
                ->whereDate('due_date', '<', $today->toDateString())
                ->with([
                    'company',
                    'subscription.enrollment.student',
                    'payments' => function ($q): void {
                        $q->orderByDesc('id');
                    },
                ])
                ->orderBy('id')
                ->chunkById(100, function ($invoices) use ($hub, $paymentService, $today, $invoicePaymentMethodResolver): void {
                    foreach ($invoices as $invoice) {
                        $invoice->loadMissing(['company', 'subscription.enrollment.student', 'payments']);
                        $student = $invoice->subscription?->enrollment?->student;
                        if ($student === null) {
                            continue;
                        }

                        $email = $student->email;
                        $recipientEmail = ($email !== null && $email !== '') ? $email : null;
                        if ($recipientEmail === null) {
                            continue;
                        }

                        $paymentUrl = null;
                        foreach ($invoice->payments as $payment) {
                            $url = $payment->payment_url;
                            if (is_string($url) && $url !== '') {
                                $paymentUrl = $url;
                                break;
                            }
                        }

                        if ($paymentUrl === null) {
                            try {
                                $gateway = $invoicePaymentMethodResolver->resolveForCompany((int) $invoice->company_id);
                                $payment = $paymentService->create($invoice, $gateway);
                                $u = $payment->payment_url;
                                $paymentUrl = is_string($u) && $u !== '' ? $u : null;
                            } catch (Throwable $e) {
                                $this->components->error(sprintf(
                                    'Falha ao obter link de pagamento da fatura %s: %s',
                                    $invoice->id,
                                    $e->getMessage()
                                ));
                            }
                        }

                        $cacheKey = 'invoice:overdue-reminder:'.$invoice->company_id.':'.$invoice->id.':'.$today->toDateString();
                        if (! Cache::add($cacheKey, 1, $today->endOfDay())) {
                            continue;
                        }

                        $hub->dispatch(new OutboundNotification(
                            NotificationType::InvoiceOverdueReminder,
                            $recipientEmail,
                            $student->full_name,
                            [
                                'invoice_id' => $invoice->id,
                                'amount' => (string) $invoice->amount,
                                'due_date' => $invoice->due_date->toDateString(),
                                'payment_url' => $paymentUrl,
                                'company_name' => (string) ($invoice->company?->name ?? ''),
                            ],
                        ));
                    }
                });
        });

        return self::SUCCESS;
    }
}
