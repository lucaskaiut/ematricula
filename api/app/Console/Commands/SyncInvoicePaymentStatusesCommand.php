<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Company\Domain\Runner\CompanyRunner;
use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Payment\Domain\Enums\PaymentStatus;
use App\Modules\Payment\Domain\Services\PaymentService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class SyncInvoicePaymentStatusesCommand extends Command
{
    protected $signature = 'payments:sync-invoice-statuses';

    protected $description = 'Consulta o status dos pagamentos pendentes e atualiza faturas quitadas';

    public function handle(PaymentService $paymentService): int
    {
        CompanyRunner::forAll(function () use ($paymentService): void {
            Invoice::query()
                ->where('status', InvoiceStatus::Pending)
                ->whereHas('payments', function ($q): void {
                    $q->where('status', PaymentStatus::Pending);
                })
                ->orderBy('id')
                ->chunkById(100, function ($invoices) use ($paymentService): void {
                    foreach ($invoices as $invoice) {
                        $payment = $invoice->payments()
                            ->where('status', PaymentStatus::Pending)
                            ->orderByDesc('id')
                            ->first();
                        if ($payment === null) {
                            continue;
                        }
                        try {
                            DB::transaction(function () use ($paymentService, $payment): void {
                                $paymentService->syncPaymentStatusForInvoice($payment);
                            });
                        } catch (Throwable $e) {
                            $this->components->error(sprintf(
                                'Falha ao sincronizar pagamento %s (fatura %s): %s',
                                $payment->id,
                                $invoice->id,
                                $e->getMessage()
                            ));
                        }
                    }
                });
        });

        return self::SUCCESS;
    }
}
