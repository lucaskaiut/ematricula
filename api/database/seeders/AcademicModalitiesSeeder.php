<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Modality\Domain\Models\Modality;
use Database\Seeders\Concerns\ResolvesSeededCompanyId;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicModalitiesSeeder extends Seeder
{
    use ResolvesSeededCompanyId;
    use WithoutModelEvents;

    private const NAMES = [
        'Ballet Clássico',
        'Jazz',
        'Hip Hop',
        'Contemporânea',
        'Sapateado',
        'Dança de Salão',
        'K-pop',
        'Dança do Ventre',
        'Samba',
        'Forró',
        'Teatro Musical',
        'Pilates',
        'Alongamento',
        'Street Dance',
        'Fit Dance',
        'Infantil',
        'Iniciante',
        'Intermediário',
        'Avançado',
        'Expressão Corporal',
    ];

    public function run(): void
    {
        $companyId = $this->seededCompanyId();
        $n = random_int(5, 20);

        for ($i = 0; $i < $n; $i++) {
            $base = self::NAMES[$i % count(self::NAMES)];
            $name = $n > count(self::NAMES) ? sprintf('%s %d', $base, intdiv($i, count(self::NAMES)) + 1) : $base;

            Modality::query()->create([
                'company_id' => $companyId,
                'name' => $name,
                'description' => fake()->optional(0.6)->sentence(),
            ]);
        }
    }
}
