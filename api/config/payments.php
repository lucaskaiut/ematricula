<?php

declare(strict_types=1);

use App\Modules\Payment\Infrastructure\Gateways\AsaasPayment;
use App\Modules\Payment\Infrastructure\Gateways\GenericPayment;

return [
    'gateways' => [
        'generic' => GenericPayment::class,
        'asaas' => AsaasPayment::class,
    ],

    'generic' => [
        'approve_after_seconds' => (int) env('PAYMENT_GENERIC_APPROVE_AFTER_SECONDS', 30),
    ],
];
