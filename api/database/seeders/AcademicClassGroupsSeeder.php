<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Modality\Domain\Models\Modality;
use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Models\Person;
use App\Modules\Plan\Domain\Models\Plan;
use Database\Seeders\Concerns\ResolvesSeededCompanyId;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicClassGroupsSeeder extends Seeder
{
    use ResolvesSeededCompanyId;
    use WithoutModelEvents;

    public function run(): void
    {
        $companyId = $this->seededCompanyId();
        $modalities = Modality::query()->get();
        $teachers = Person::query()->where('profile', PersonProfile::Teacher)->get();
        $plans = Plan::query()->get();

        if ($modalities->isEmpty() || $teachers->isEmpty()) {
            return;
        }

        $n = random_int(5, 20);

        for ($i = 1; $i <= $n; $i++) {
            $modality = $modalities->random();

            $candidates = $teachers->filter(
                fn (Person $t) => $t->modalities()->where('modalities.id', $modality->id)->exists(),
            );

            $teacher = $candidates->isNotEmpty() ? $candidates->random() : $teachers->random();

            if (! $teacher->modalities()->where('modalities.id', $modality->id)->exists()) {
                $teacher->modalities()->attach($modality->id);
            }

            $weekdays = collect([0, 1, 2, 3, 4, 5, 6])
                ->shuffle()
                ->take(random_int(2, 4))
                ->sort()
                ->values()
                ->all();

            $classGroup = ClassGroup::query()->create([
                'company_id' => $companyId,
                'name' => sprintf('Turma Seed %02d', $i),
                'modality_id' => $modality->id,
                'teacher_person_id' => $teacher->id,
                'max_capacity' => fake()->optional(0.7)->randomElement([12, 15, 18, 20, 25]),
                'weekdays' => $weekdays,
                'starts_at' => sprintf('%02d:%02d:00', random_int(8, 17), random_int(0, 1) * 30),
                'ends_at' => sprintf('%02d:%02d:00', random_int(18, 21), random_int(0, 1) * 30),
            ]);

            if ($plans->isNotEmpty()) {
                $pick = min(random_int(1, 3), $plans->count());
                $chosenPlans = $plans->shuffle()->take($pick);
                $classGroup->plans()->attach($chosenPlans->pluck('id')->all());
            }
        }
    }
}
