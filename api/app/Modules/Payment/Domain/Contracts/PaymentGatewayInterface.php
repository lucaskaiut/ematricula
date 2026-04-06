<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\Contracts;

use App\Modules\Payment\Domain\DTOs\CreatePaymentData;
use App\Modules\Payment\Domain\DTOs\PaymentResponse;
use App\Modules\Payment\Domain\Enums\PaymentStatus;

interface PaymentGatewayInterface
{
    public function createPayment(CreatePaymentData $data): PaymentResponse;

    public function getPaymentStatus(string $paymentId): PaymentStatus;
}
