<?php

declare(strict_types=1);

namespace App\Modules\Person\Domain\Services;

use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Models\Person;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;

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

    protected function relationshipAllOfFilters(): array
    {
        return [
            'modality_ids' => ['modalities', 'modalities.id'],
        ];
    }

    public function create(array $attributes): Model
    {
        $modalityIds = $this->pullModalityIdsForSync($attributes);
        /** @var Person $person */
        $person = $this->model()->create($attributes);
        $this->syncModalitiesForTeacher($person->fresh(), $modalityIds);

        return $person->fresh(['modalities']);
    }

    public function update(int|string $id, array $attributes): Model
    {
        $modalityIds = $this->pullModalityIdsForSync($attributes);
        $model = $this->findOrFail($id);
        $model->update($attributes);
        $model->refresh();
        $this->syncModalitiesForTeacher($model, $modalityIds);

        return $model->fresh(['modalities']);
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

    /**
     * @return ?array<int> null = omit sync; [] = detach all (teacher) or detach (non-teacher)
     */
    private function pullModalityIdsForSync(array &$attributes): ?array
    {
        if (! array_key_exists('modality_ids', $attributes)) {
            return null;
        }

        $raw = $attributes['modality_ids'];
        unset($attributes['modality_ids']);

        if (! is_array($raw)) {
            return [];
        }

        return $this->normalizePositiveIntList($raw);
    }

    private function syncModalitiesForTeacher(Person $person, ?array $modalityIds): void
    {
        if ($modalityIds === null) {
            return;
        }

        if ($person->profile !== PersonProfile::Teacher) {
            $person->modalities()->detach();

            return;
        }

        $person->modalities()->sync($modalityIds);
    }
}
