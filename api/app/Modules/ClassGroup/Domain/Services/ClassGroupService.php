<?php

declare(strict_types=1);

namespace App\Modules\ClassGroup\Domain\Services;

use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;

class ClassGroupService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = ClassGroup::class;

    protected function allowedOrderBy(): array
    {
        return [
            'id',
            'name',
            'modality_id',
            'teacher_person_id',
            'max_capacity',
            'starts_at',
            'ends_at',
            'created_at',
            'updated_at',
        ];
    }
}
