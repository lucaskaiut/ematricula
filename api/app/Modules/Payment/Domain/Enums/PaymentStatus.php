<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Cancelled = 'cancelled';
}
