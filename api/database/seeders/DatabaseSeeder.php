<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Acl\Domain\Models\Role;
use App\Modules\Company\Domain\Models\Company;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(SettingsSeeder::class);

        $company = Company::query()->first();

        if (! $company) {
            throw new \RuntimeException('Nenhuma company encontrada. Crie uma company antes de rodar o seed de usuários.');
        }

        app('company')->registerCompany($company);

        $this->call(AcademicDemoSeeder::class);

        $role = Role::query()
            ->withoutGlobalScopes()
            ->where('company_id', $company->id)
            ->orderBy('id')
            ->first();

        if ($role === null) {
            $role = Role::query()->withoutGlobalScopes()->firstOrCreate(
                [
                    'company_id' => $company->id,
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
        }

        User::factory()
            ->count(50)
            ->create([
                'company_id' => $company->id,
                'role_id' => $role->id,
            ]);
    }
}
