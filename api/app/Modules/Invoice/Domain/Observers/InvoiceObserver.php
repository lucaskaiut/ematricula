<?php

declare(strict_types=1);

namespace App\Modules\Invoice\Domain\Observers;

use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Notification\Domain\Dtos\OutboundNotification;
use App\Modules\Notification\Domain\Enums\NotificationType;
use App\Modules\Notification\Domain\Services\NotificationHub;
use App\Modules\Payment\Domain\Services\InvoicePaymentMethodResolver;
use App\Modules\Payment\Domain\Services\PaymentService;
use Illuminate\Support\Facades\DB;

final class InvoiceObserver
{
    public function __construct(
        private readonly NotificationHub $hub,
        private readonly PaymentService $paymentService,
        private readonly InvoicePaymentMethodResolver $invoicePaymentMethodResolver,
    ) {}

    public function created(Invoice $invoice): void
    {
        $gateway = $this->invoicePaymentMethodResolver->resolveForCompany((int) $invoice->company_id);
        $payment = $this->paymentService->create($invoice, $gateway);

        $invoice->loadMissing(['subscription.enrollment.student', 'company']);
        $student = $invoice->subscription?->enrollment?->student;

        $recipientEmail = null;
        $recipientName = null;
        if ($student !== null) {
            $email = $student->email;
            $recipientEmail = ($email !== null && $email !== '') ? $email : null;
            $recipientName = $student->full_name;
        }

        $notification = new OutboundNotification(
            NotificationType::InvoiceCreated,
            $recipientEmail,
            $recipientName,
            [
                'invoice_id' => $invoice->id,
                'amount' => (string) $invoice->amount,
                'due_date' => $invoice->due_date->toDateString(),
                'payment_url' => $payment->payment_url,
                'company_name' => (string) ($invoice->company?->name ?? ''),
            ],
        );

        DB::afterCommit(function () use ($notification): void {
            $this->hub->dispatch($notification);
        });
    }
}
