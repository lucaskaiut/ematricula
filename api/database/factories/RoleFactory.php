<?php

namespace Database\Factories;

use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Acl\Domain\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'permissions' => array_map(
                static fn (Permission $p) => $p->value,
                Permission::cases()
            ),
        ];
    }
}
