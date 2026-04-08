<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\Observers;

use App\Modules\Notification\Domain\Dtos\OutboundNotification;
use App\Modules\Notification\Domain\Enums\NotificationType;
use App\Modules\Notification\Domain\Services\NotificationHub;
use App\Modules\Payment\Domain\Enums\PaymentStatus;
use App\Modules\Payment\Domain\Models\Payment;
use Illuminate\Support\Facades\DB;

final class PaymentObserver
{
    public function __construct(
        private readonly NotificationHub $hub,
    ) {}

    public function created(Payment $payment): void
    {
        if ($payment->status !== PaymentStatus::Approved) {
            return;
        }

        $this->dispatchConfirmation($payment);
    }

    public function updated(Payment $payment): void
    {
        if (! $payment->wasChanged('status') || $payment->status !== PaymentStatus::Approved) {
            return;
        }

        $originalStatus = $payment->getOriginal('status');
        $previous = $originalStatus instanceof PaymentStatus
            ? $originalStatus
            : PaymentStatus::tryFrom((string) $originalStatus);
        if ($previous === PaymentStatus::Approved) {
            return;
        }

        $this->dispatchConfirmation($payment);
    }

    private function dispatchConfirmation(Payment $payment): void
    {
        $payment->loadMissing(['invoice.subscription.enrollment.student', 'invoice.company']);
        $invoice = $payment->invoice;
        if ($invoice === null) {
            return;
        }

        $student = $invoice->subscription?->enrollment?->student;
        $recipientEmail = null;
        $recipientName = null;
        if ($student !== null) {
            $email = $student->email;
            $recipientEmail = ($email !== null && $email !== '') ? $email : null;
            $recipientName = $student->full_name;
        }

        $notification = new OutboundNotification(
            NotificationType::PaymentConfirmed,
            $recipientEmail,
            $recipientName,
            [
                'invoice_id' => $invoice->id,
                'amount' => (string) $invoice->amount,
                'due_date' => $invoice->due_date->toDateString(),
                'confirmed_at' => now()->toDateString(),
                'company_name' => (string) ($invoice->company?->name ?? ''),
            ],
        );

        DB::afterCommit(function () use ($notification): void {
            $this->hub->dispatch($notification);
        });
    }
}
