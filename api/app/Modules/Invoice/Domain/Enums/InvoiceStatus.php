<?php

declare(strict_types=1);

namespace App\Modules\Invoice\Domain\Enums;

enum InvoiceStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
}
