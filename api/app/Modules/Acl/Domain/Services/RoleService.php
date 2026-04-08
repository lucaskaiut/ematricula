<?php

declare(strict_types=1);

namespace App\Modules\Acl\Domain\Services;

use App\Modules\Acl\Domain\Models\Role;
use App\Modules\Core\Domain\Contracts\ServiceContract;
use App\Modules\Core\Domain\Traits\ServiceTrait;
use Illuminate\Database\Eloquent\Model;

class RoleService implements ServiceContract
{
    use ServiceTrait;

    protected string $model = Role::class;

    protected function allowedOrderBy(): array
    {
        return ['id', 'name', 'created_at', 'updated_at'];
    }

    public function create(array $attributes): Model
    {
        /** @var Role $role */
        $role = $this->model()->newInstance();
        $role->fill([
            'name' => $attributes['name'],
            'description' => $attributes['description'] ?? null,
        ]);
        $permissions = $attributes['permissions'] ?? [];
        $role->syncPermissionsList(is_array($permissions) ? $permissions : []);
        $role->save();

        return $role->fresh();
    }

    public function update(int|string $id, array $attributes): Model
    {
        /** @var Role $role */
        $role = $this->findOrFail($id);

        if (array_key_exists('name', $attributes)) {
            $role->name = $attributes['name'];
        }
        if (array_key_exists('description', $attributes)) {
            $role->description = $attributes['description'];
        }
        if (array_key_exists('permissions', $attributes)) {
            $perms = $attributes['permissions'];
            $role->syncPermissionsList(is_array($perms) ? $perms : []);
        }
        $role->save();

        return $role->fresh();
    }

    public function delete(int|string $id): bool
    {
        /** @var Role $role */
        $role = $this->findOrFail($id);

        if ($role->users()->exists()) {
            throw new \InvalidArgumentException('Não é possível excluir um perfil vinculado a usuários.');
        }

        return (bool) $role->delete();
    }
}
