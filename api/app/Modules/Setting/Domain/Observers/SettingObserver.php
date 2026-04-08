<?php

declare(strict_types=1);

namespace App\Modules\Setting\Domain\Observers;

use App\Modules\Setting\Domain\Models\Setting;
use App\Modules\Setting\Domain\Services\TenantSettingsService;

final class SettingObserver
{
    public function __construct(
        private readonly TenantSettingsService $tenantSettings,
    ) {}

    public function saved(Setting $setting): void
    {
        $this->tenantSettings->forgetAllCompaniesCache();
    }

    public function deleted(Setting $setting): void
    {
        $this->tenantSettings->forgetAllCompaniesCache();
    }
}
