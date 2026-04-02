<?php

declare(strict_types=1);

namespace App\Modules\Core\Domain\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

trait ServiceTrait
{
    /**
     * The concrete service must define:
     *
     * protected Model $model;
     */

    private function model(): Model
    {
        return app($this->model);
    }

    protected function newQuery(array $relations = []): Builder
    {
        return $this->model()
            ->newQuery()
            ->with($relations);
    }

    public function create(array $attributes): Model
    {
        return $this->model()->create($attributes);
    }

    public function all(
        array $columns = ['*'],
        array $relations = [],
        array $orderBy = []
    ): Collection {
        $query = $this->newQuery($relations);

        $this->applyOrdering($query, $orderBy);

        return $query->get($columns);
    }

    public function find(
        int|string $id,
        array $columns = ['*'],
        array $relations = []
    ): ?Model {
        return $this->newQuery($relations)->find($id, $columns);
    }

    public function findOrFail(
        int|string $id,
        array $columns = ['*'],
        array $relations = []
    ): Model {
        return $this->newQuery($relations)->findOrFail($id, $columns);
    }

    public function findBy(
        array $conditions,
        array $columns = ['*'],
        array $relations = []
    ): ?Model {
        $query = $this->newQuery($relations);

        $this->applyConditions($query, $conditions);

        return $query->first($columns);
    }

    public function getBy(
        array $conditions = [],
        array $columns = ['*'],
        array $relations = [],
        array $orderBy = []
    ): Collection {
        $query = $this->newQuery($relations);

        $this->applyConditions($query, $conditions);
        $this->applyOrdering($query, $orderBy);

        return $query->get($columns);
    }

    public function paginate(
        int $perPage = 15,
        array $conditions = [],
        array $columns = ['*'],
        array $relations = [],
        array $orderBy = []
    ): LengthAwarePaginator {
        $query = $this->newQuery($relations);

        $this->applyConditions($query, $conditions);
        $this->applyOrdering($query, $orderBy);

        return $query->paginate($perPage, $columns);
    }

    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);

        $model->update($attributes);

        return $model->fresh();
    }

    public function delete(int|string $id): bool
    {
        $model = $this->findOrFail($id);

        return (bool) $model->delete();
    }

    protected function applyConditions(Builder $query, array $conditions): void
    {
        foreach ($conditions as $field => $value) {
            if (! is_array($value)) {
                $query->where($field, '=', $value);

                continue;
            }

            $count = count($value);

            if ($count === 2) {
                [$operator, $val] = $value;
                $query->where($field, $operator, $val);

                continue;
            }

            if ($count === 3) {
                [$operator, $a, $b] = $value;

                if (is_string($operator) && strtolower($operator) === 'between') {
                    [$start, $end] = $this->normalizeBetweenBounds((string) $a, (string) $b);
                    $query->whereBetween($field, [$start, $end]);

                    continue;
                }
            }
        }
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function normalizeBetweenBounds(string $start, string $end): array
    {
        $dateOnly = '/^\d{4}-\d{2}-\d{2}$/';

        if (preg_match($dateOnly, $start) === 1) {
            $start = $start . ' 00:00:00';
        }

        if (preg_match($dateOnly, $end) === 1) {
            $end = $end . ' 23:59:59';
        }

        return [$start, $end];
    }

    protected function applyOrdering(Builder $query, array $orderBy): void
    {
        $normalized = $this->normalizeOrderBy($orderBy);

        foreach ($normalized as $field => $direction) {
            $query->orderBy($field, $direction);
        }
    }

    protected function allowedOrderBy(): array
    {
        return [];
    }

    protected function normalizeOrderBy(array $orderBy): array
    {
        $allowed = $this->allowedOrderBy();
        $hasAllowList = count($allowed) > 0;
        $allowedMap = $hasAllowList ? array_fill_keys($allowed, true) : [];

        $normalized = [];

        foreach ($orderBy as $field => $direction) {
            if (!is_string($field) || $field === '') continue;
            if ($hasAllowList && !isset($allowedMap[$field])) continue;

            $dir = is_string($direction) ? strtolower(trim($direction)) : 'asc';
            $normalized[$field] = $dir === 'desc' ? 'desc' : 'asc';
        }

        return $normalized;
    }
}
