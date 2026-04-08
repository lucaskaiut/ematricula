<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\Services;

use App\Modules\Setting\Domain\Services\TenantSettingsService;

class InvoicePaymentMethodResolver
{
    public function __construct(
        private readonly TenantSettingsService $tenantSettings,
    ) {}

    public function resolveForCompany(int $companyId): string
    {
        $raw = $this->tenantSettings->getValue($companyId, 'invoice.payment_method');
        $key = is_string($raw) ? trim($raw) : '';
        $gateways = array_keys(config('payments.gateways', []));

        if ($key !== '' && in_array($key, $gateways, true)) {
            return $key;
        }

        return 'generic';
    }
}
