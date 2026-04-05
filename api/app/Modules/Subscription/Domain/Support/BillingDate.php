<?php

declare(strict_types=1);

namespace App\Modules\Subscription\Domain\Support;

use Carbon\CarbonImmutable;

final class BillingDate
{
    public static function addCycle(CarbonImmutable $from, string $billingCycle, int $interval): CarbonImmutable
    {
        return match ($billingCycle) {
            'month' => $from->addMonths($interval),
            'year' => $from->addYears($interval),
            default => $from->addMonths($interval),
        };
    }
}
