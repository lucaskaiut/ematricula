<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\DTOs;

use App\Modules\Payment\Domain\Enums\PaymentStatus;

readonly class PaymentResponse
{
    public function __construct(
        public string $gatewayPaymentId,
        public string $paymentUrl,
        public PaymentStatus $status,
    ) {}
}
