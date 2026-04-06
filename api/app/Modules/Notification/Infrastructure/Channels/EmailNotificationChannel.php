<?php

declare(strict_types=1);

namespace App\Modules\Notification\Infrastructure\Channels;

use App\Modules\Notification\Domain\Contracts\NotificationChannel;
use App\Modules\Notification\Domain\Dtos\OutboundNotification;
use App\Modules\Notification\Domain\Enums\NotificationType;
use App\Modules\Notification\Mail\InvoiceCreatedMail;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;

final class EmailNotificationChannel implements NotificationChannel
{
    public function handles(OutboundNotification $notification): bool
    {
        if ($notification->recipientEmail === null || $notification->recipientEmail === '') {
            return false;
        }

        return $notification->type === NotificationType::InvoiceCreated;
    }

    public function send(OutboundNotification $notification): void
    {
        if ($notification->type !== NotificationType::InvoiceCreated) {
            return;
        }

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

        Mail::to($notification->recipientEmail)->send(
            new InvoiceCreatedMail($name, $amountDisplay, $dueDateDisplay, $invoiceId, $paymentUrl)
        );
    }
}
