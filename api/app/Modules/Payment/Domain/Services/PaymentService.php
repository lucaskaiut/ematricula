<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\Services;

use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Payment\Domain\Contracts\PaymentGatewayRegistryInterface;
use App\Modules\Payment\Domain\DTOs\CreatePaymentData;
use App\Modules\Payment\Domain\Enums\PaymentStatus;
use App\Modules\Payment\Domain\Models\Payment;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly PaymentGatewayRegistryInterface $gatewayRegistry,
    ) {}

    public function create(Invoice $invoice, string $paymentMethod): Payment
    {
        if ($invoice->status !== InvoiceStatus::Pending) {
            throw ValidationException::withMessages([
                'invoice' => ['Somente faturas pendentes podem gerar pagamento.'],
            ]);
        }

        $existing = Payment::query()->where('invoice_id', $invoice->id)->first();
        if ($existing !== null) {
            return $existing;
        }

        $gateway = $this->gatewayRegistry->get($paymentMethod);
        $data = new CreatePaymentData(
            invoiceId: (int) $invoice->id,
            amount: (string) $invoice->amount,
            companyId: (int) $invoice->company_id,
            dueDate: $invoice->due_date?->format('Y-m-d'),
        );
        $response = $gateway->createPayment($data);

        return Payment::query()->create([
            'company_id' => $invoice->company_id,
            'invoice_id' => $invoice->id,
            'gateway' => $paymentMethod,
            'gateway_payment_id' => $response->gatewayPaymentId,
            'status' => $response->status,
            'payment_url' => $response->paymentUrl,
        ]);
    }

    public function getStatus(Payment $payment): PaymentStatus
    {
        $gateway = $this->gatewayRegistry->get($payment->gateway);
        $status = $gateway->getPaymentStatus($payment->gateway_payment_id, $payment);
        $payment->status = $status;
        $payment->save();

        return $status;
    }

    public function syncPaymentStatusForInvoice(Payment $payment): PaymentStatus
    {
        $payment->loadMissing('invoice');
        $status = $this->getStatus($payment);

        if ($status !== PaymentStatus::Approved) {
            return $status;
        }

        $invoice = $payment->invoice;
        if ($invoice === null || $invoice->status !== InvoiceStatus::Pending) {
            return $status;
        }

        $invoice->status = InvoiceStatus::Paid;
        $invoice->paid_at = now();
        $invoice->save();

        return $status;
    }
}
