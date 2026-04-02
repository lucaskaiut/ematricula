<?php

declare(strict_types=1);

namespace App\Modules\Modality\Domain\Services;

use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use App\Modules\Modality\Domain\Models\Modality;

class ModalityService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = Modality::class;

    protected function allowedOrderBy(): array
    {
        return [
            'id',
            'name',
            'description',
            'created_at',
            'updated_at',
        ];
    }
}
