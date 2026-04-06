<?php

declare(strict_types=1);

namespace App\Modules\Notification\Domain\Enums;

enum NotificationType: string
{
    case InvoiceCreated = 'invoice.created';
}
