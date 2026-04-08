<?php

declare(strict_types=1);

namespace Database\Seeders\Concerns;

use App\Modules\Company\Domain\Models\Company;

trait ResolvesSeededCompanyId
{
    protected function seededCompanyId(): int
    {
        $registered = app('company')->company();
        if ($registered !== null) {
            return $registered->id;
        }

        $company = Company::query()->first();
        if ($company === null) {
            throw new \RuntimeException('Nenhuma company encontrada para o seed.');
        }

        app('company')->registerCompany($company);

        return $company->id;
    }
}
