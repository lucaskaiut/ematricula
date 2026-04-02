<?php

declare(strict_types=1);

namespace App\Modules\Person\Domain\Services;

use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use App\Modules\Person\Domain\Models\Person;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PersonService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = Person::class;

    protected function allowedOrderBy(): array
    {
        return [
            'id',
            'full_name',
            'email',
            'birth_date',
            'profile',
            'status',
            'created_at',
            'updated_at',
        ];
    }

    public function paginate(
        int $perPage = 15,
        array $conditions = [],
        array $columns = ['*'],
        array $relations = [],
        array $orderBy = []
    ): LengthAwarePaginator {
        $eligibleGuardian = false;
        if (array_key_exists('eligible_as_guardian', $conditions)) {
            $eligibleGuardian = filter_var(
                $conditions['eligible_as_guardian'],
                FILTER_VALIDATE_BOOLEAN,
            );
            unset($conditions['eligible_as_guardian']);
        }

        $query = $this->newQuery($relations);

        if ($eligibleGuardian) {
            $table = $query->getModel()->getTable();
            $query->whereDate("{$table}.birth_date", '<=', today()->subYears(18));
        }

        $this->applyConditions($query, $conditions);
        $this->applyOrdering($query, $orderBy);

        return $query->paginate($perPage, $columns);
    }
}
