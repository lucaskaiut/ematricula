<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Modality\Domain\Models\Modality;
use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Enums\PersonStatus;
use App\Modules\Person\Domain\Models\Person;
use Database\Seeders\Concerns\ResolvesSeededCompanyId;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicTeachersSeeder extends Seeder
{
    use ResolvesSeededCompanyId;
    use WithoutModelEvents;

    public function run(): void
    {
        $companyId = $this->seededCompanyId();
        $modalities = Modality::query()->get();

        if ($modalities->isEmpty()) {
            return;
        }

        $n = random_int(5, 20);

        for ($i = 1; $i <= $n; $i++) {
            $cpf = str_pad((string) (700_000_000 + $i), 11, '0', STR_PAD_LEFT);

            $teacher = Person::query()->create([
                'company_id' => $companyId,
                'full_name' => fake('pt_BR')->name(),
                'birth_date' => fake()->dateTimeBetween('-55 years', '-24 years'),
                'cpf' => $cpf,
                'phone' => fake()->numerify('11 9####-####'),
                'email' => sprintf('professor.seed.%d.%s@example.test', $i, fake()->unique()->lexify('????')),
                'guardian_person_id' => null,
                'status' => PersonStatus::Active,
                'notes' => null,
                'profile' => PersonProfile::Teacher,
            ]);

            $pickedModalities = $modalities->shuffle()->take(min(3, $modalities->count()));
            $teacher->modalities()->attach($pickedModalities->pluck('id')->all());
        }
    }
}
