<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Payment\Domain\Contracts\PaymentGatewayRegistryInterface;
use App\Modules\Payment\Infrastructure\Gateways\GenericPayment;
use App\Modules\Payment\Infrastructure\PaymentGatewayRegistry;
use Illuminate\Support\ServiceProvider;

class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(GenericPayment::class, function () {
            return new GenericPayment(
                approveAfterSeconds: (int) config('payments.generic.approve_after_seconds', 30),
            );
        });

        $this->app->singleton(PaymentGatewayRegistryInterface::class, function ($app) {
            return new PaymentGatewayRegistry(
                $app,
                config('payments.gateways', []),
            );
        });
    }
}
