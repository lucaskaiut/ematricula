<?php

declare(strict_types=1);

namespace App\Modules\Payment\Infrastructure;

use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;
use App\Modules\Payment\Domain\Contracts\PaymentGatewayRegistryInterface;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

class PaymentGatewayRegistry implements PaymentGatewayRegistryInterface
{
    /**
     * @param  array<string, class-string<PaymentGatewayInterface>>  $gateways
     */
    public function __construct(
        private readonly Container $container,
        private readonly array $gateways,
    ) {}

    public function get(string $paymentMethod): PaymentGatewayInterface
    {
        $class = $this->gateways[$paymentMethod] ?? null;
        if ($class === null || ! is_subclass_of($class, PaymentGatewayInterface::class)) {
            throw new InvalidArgumentException(
                sprintf('Método de pagamento desconhecido ou inválido: %s', $paymentMethod)
            );
        }

        return $this->container->make($class);
    }
}
