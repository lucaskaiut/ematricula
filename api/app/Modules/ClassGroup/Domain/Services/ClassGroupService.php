<?php

declare(strict_types=1);

namespace App\Modules\ClassGroup\Domain\Services;

use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use Illuminate\Database\Eloquent\Model;

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

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Model
    {
        $planIds = $this->pullPlanIds($attributes);
        $model = $this->model()->create($attributes);
        if ($planIds !== null) {
            $model->plans()->sync($planIds);
        }

        return $model->fresh([
            'modality',
            'teacher',
            'creator',
            'updater',
            'plans',
        ]) ?? $model;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(int|string $id, array $attributes): Model
    {
        $model = $this->findOrFail($id);
        $planIds = $this->pullPlanIds($attributes);
        $model->update($attributes);
        if ($planIds !== null) {
            $model->plans()->sync($planIds);
        }

        $fresh = $model->fresh([
            'modality',
            'teacher',
            'creator',
            'updater',
            'plans',
        ]);

        return $fresh ?? $model;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return list<int>|null
     */
    private function pullPlanIds(array &$attributes): ?array
    {
        if (! array_key_exists('plan_ids', $attributes)) {
            return null;
        }

        $raw = $attributes['plan_ids'];
        unset($attributes['plan_ids']);

        if (! is_array($raw)) {
            return [];
        }

        $ids = [];
        foreach ($raw as $item) {
            $id = (int) $item;
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return array_values(array_unique($ids));
    }
}
