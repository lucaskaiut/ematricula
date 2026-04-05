<?php

declare(strict_types=1);

namespace App\Modules\Plan\Domain\Services;

use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use App\Modules\Plan\Domain\Models\Plan;

class PlanService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = Plan::class;

    protected function allowedOrderBy(): array
    {
        return [
            'id',
            'name',
            'price',
            'billing_cycle',
            'billing_interval',
            'created_at',
            'updated_at',
        ];
    }
}
