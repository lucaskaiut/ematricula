<?php

declare(strict_types=1);

namespace App\Modules\Plan\Domain\Enums;

enum BillingCycle: string
{
    case Month = 'month';
    case Year = 'year';
}
