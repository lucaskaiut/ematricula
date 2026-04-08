<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Plan\Domain\Enums\BillingCycle;
use App\Modules\Plan\Domain\Models\Plan;
use Database\Seeders\Concerns\ResolvesSeededCompanyId;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AcademicPlansSeeder extends Seeder
{
    use ResolvesSeededCompanyId;
    use WithoutModelEvents;

    public function run(): void
    {
        $companyId = $this->seededCompanyId();
        $n = random_int(5, 20);

        for ($i = 1; $i <= $n; $i++) {
            $cycle = fake()->randomElement([BillingCycle::Month, BillingCycle::Year]);
            $interval = 1;
            $price = fake()->randomFloat(2, 80, 450);

            if ($cycle === BillingCycle::Year) {
                $price = fake()->randomFloat(2, 800, 4200);
            }

            Plan::query()->create([
                'company_id' => $companyId,
                'name' => sprintf('Plano Seed %02d', $i),
                'price' => $price,
                'billing_cycle' => $cycle,
                'billing_interval' => $interval,
            ]);
        }
    }
}
