<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Acl\Domain\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function configure(): static
    {
        return $this->afterCreating(function (User $user): void {
            if ($user->role_id !== null) {
                return;
            }
            $role = Role::query()->withoutGlobalScopes()->firstOrCreate(
                [
                    'company_id' => $user->company_id,
                    'name' => 'Administrador',
                ],
                [
                    'description' => 'Acesso total ao sistema',
                    'permissions' => array_map(
                        static fn (Permission $p) => $p->value,
                        Permission::cases()
                    ),
                ]
            );
            $user->forceFill(['role_id' => $role->id])->saveQuietly();
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
