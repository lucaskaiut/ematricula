<?php

declare(strict_types=1);

namespace App\Modules\Notification\Infrastructure\Channels;

use App\Modules\Notification\Domain\Contracts\NotificationChannel;
use App\Modules\Notification\Domain\Dtos\OutboundNotification;
use App\Modules\Notification\Domain\Enums\NotificationType;
use App\Modules\Notification\Mail\InvoiceCreatedMail;
use App\Modules\Notification\Mail\InvoiceDueReminderMail;
use App\Modules\Notification\Mail\InvoiceOverdueReminderMail;
use App\Modules\Notification\Mail\PaymentConfirmedMail;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;

final class EmailNotificationChannel implements NotificationChannel
{
    public function handles(OutboundNotification $notification): bool
    {
        if ($notification->recipientEmail === null || $notification->recipientEmail === '') {
            return false;
        }

        return $notification->type === NotificationType::InvoiceCreated
            || $notification->type === NotificationType::InvoiceDueReminder
            || $notification->type === NotificationType::InvoiceOverdueReminder
            || $notification->type === NotificationType::PaymentConfirmed;
    }

    public function send(OutboundNotification $notification): void
    {
        if ($notification->type === NotificationType::InvoiceCreated) {
            $this->sendInvoiceCreated($notification);

            return;
        }

        if ($notification->type === NotificationType::InvoiceDueReminder) {
            $this->sendInvoiceDueReminder($notification);

            return;
        }

        if ($notification->type === NotificationType::InvoiceOverdueReminder) {
            $this->sendInvoiceOverdueReminder($notification);

            return;
        }

        if ($notification->type === NotificationType::PaymentConfirmed) {
            $this->sendPaymentConfirmed($notification);
        }
    }

    private function sendInvoiceCreated(OutboundNotification $notification): void
    {
        $companyName = $this->companyDisplayName($notification);
        [$name, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl] = $this->resolvedMailParts($notification);

        Mail::to($notification->recipientEmail)->send(
            new InvoiceCreatedMail($name, $companyName, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl)
        );
    }

    private function sendInvoiceDueReminder(OutboundNotification $notification): void
    {
        $companyName = $this->companyDisplayName($notification);
        [$name, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl] = $this->resolvedMailParts($notification);

        Mail::to($notification->recipientEmail)->send(
            new InvoiceDueReminderMail($name, $companyName, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl)
        );
    }

    private function sendInvoiceOverdueReminder(OutboundNotification $notification): void
    {
        $companyName = $this->companyDisplayName($notification);
        [$name, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl] = $this->resolvedMailParts($notification);

        Mail::to($notification->recipientEmail)->send(
            new InvoiceOverdueReminderMail($name, $companyName, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl)
        );
    }

    private function sendPaymentConfirmed(OutboundNotification $notification): void
    {
        $companyName = $this->companyDisplayName($notification);
        [$name, $amountDisplay, $dueDateDisplay, $invoiceId] = $this->resolvedMailParts($notification);
        $confirmedAt = (string) ($notification->payload['confirmed_at'] ?? '');

        try {
            $confirmedAtDisplay = CarbonImmutable::parse($confirmedAt)->format('d/m/Y');
        } catch (\Throwable) {
            $confirmedAtDisplay = $confirmedAt;
        }

        Mail::to($notification->recipientEmail)->send(
            new PaymentConfirmedMail($name, $companyName, $amountDisplay, $dueDateDisplay, $invoiceId, $confirmedAtDisplay)
        );
    }

    private function companyDisplayName(OutboundNotification $notification): string
    {
        $name = $notification->payload['company_name'] ?? '';

        return is_string($name) && $name !== '' ? $name : 'sua instituição';
    }

    private function resolvedMailParts(OutboundNotification $notification): array
    {
        $amount = (string) ($notification->payload['amount'] ?? '0');
        $dueDate = (string) ($notification->payload['due_date'] ?? '');
        $invoiceId = (int) ($notification->payload['invoice_id'] ?? 0);
        $paymentUrl = $notification->payload['payment_url'] ?? null;
        $paymentUrl = is_string($paymentUrl) && $paymentUrl !== '' ? $paymentUrl : null;
        $name = $notification->recipientName ?? 'Aluno';

        $amountDisplay = 'R$ '.number_format((float) $amount, 2, ',', '.');

        try {
            $dueDateDisplay = CarbonImmutable::parse($dueDate)->format('d/m/Y');
        } catch (\Throwable) {
            $dueDateDisplay = $dueDate;
        }

        return [$name, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl];
    }
}
