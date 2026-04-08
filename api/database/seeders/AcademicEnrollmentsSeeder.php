<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Enrollment\Domain\Models\Enrollment;
use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Models\Person;
use Carbon\Carbon;
use Database\Seeders\Concerns\ResolvesSeededCompanyId;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicEnrollmentsSeeder extends Seeder
{
    use ResolvesSeededCompanyId;
    use WithoutModelEvents;

    public function run(): void
    {
        $companyId = $this->seededCompanyId();
        $students = Person::query()->where('profile', PersonProfile::Student)->get();
        $classGroups = ClassGroup::query()->get();

        if ($students->isEmpty() || $classGroups->isEmpty()) {
            return;
        }

        $target = random_int(5, 20);

        $pairs = $students->crossJoin($classGroups)
            ->shuffle()
            ->take(min($target, $students->count() * $classGroups->count()));

        foreach ($pairs as [$student, $classGroup]) {
            if (Enrollment::query()
                ->where('student_person_id', $student->id)
                ->where('class_group_id', $classGroup->id)
                ->exists()) {
                continue;
            }

            $startsOn = now()->subDays(random_int(5, 120))->toDateString();
            $endsOn = fake()->boolean(15)
                ? Carbon::parse($startsOn)->addMonths(random_int(3, 12))->toDateString()
                : null;

            Enrollment::query()->create([
                'company_id' => $companyId,
                'student_person_id' => $student->id,
                'class_group_id' => $classGroup->id,
                'starts_on' => $startsOn,
                'ends_on' => $endsOn,
                'status' => fake()->randomElement([
                    EnrollmentStatus::Active,
                    EnrollmentStatus::Active,
                    EnrollmentStatus::Active,
                    EnrollmentStatus::Locked,
                ]),
            ]);

            if (! $student->modalities()->where('modalities.id', $classGroup->modality_id)->exists()) {
                $student->modalities()->attach($classGroup->modality_id);
            }
        }
    }
}
