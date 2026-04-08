<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Company\Domain\Models\Company;
use Illuminate\Database\Seeder;

class AcademicDemoSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->first();

        if ($company === null) {
            throw new \RuntimeException('Nenhuma company encontrada. Crie uma company antes de rodar o seed acadêmico.');
        }

        app('company')->registerCompany($company);

        $this->call([
            AcademicModalitiesSeeder::class,
            AcademicTeachersSeeder::class,
            AcademicStudentsSeeder::class,
            AcademicPlansSeeder::class,
            AcademicClassGroupsSeeder::class,
            AcademicEnrollmentsSeeder::class,
        ]);
    }
}
