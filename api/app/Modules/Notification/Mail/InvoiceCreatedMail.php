<?php

declare(strict_types=1);

namespace App\Modules\Notification\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceCreatedMail extends Mailable implements ShouldQueue, ShouldQueueAfterCommit
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $studentName,
        public string $amountDisplay,
        public string $dueDateDisplay,
        public int $invoiceId,
        public ?string $paymentUrl = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nova fatura disponível',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.invoice-created',
        );
    }
}
