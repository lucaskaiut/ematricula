<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\Contracts;

interface PaymentGatewayRegistryInterface
{
    public function get(string $paymentMethod): PaymentGatewayInterface;
}
