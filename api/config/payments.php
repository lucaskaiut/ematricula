<?php

declare(strict_types=1);

use App\Modules\Payment\Infrastructure\Gateways\GenericPayment;

return [
    'gateways' => [
        'generic' => GenericPayment::class,
    ],

    'default_gateway_on_invoice_create' => (string) env('PAYMENT_DEFAULT_GATEWAY_ON_INVOICE_CREATE', 'generic'),

    'generic' => [
        'approve_after_seconds' => (int) env('PAYMENT_GENERIC_APPROVE_AFTER_SECONDS', 30),
    ],
];
