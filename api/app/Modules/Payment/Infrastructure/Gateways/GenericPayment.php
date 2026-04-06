<?php

declare(strict_types=1);

namespace App\Modules\Payment\Infrastructure\Gateways;

use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;
use App\Modules\Payment\Domain\DTOs\CreatePaymentData;
use App\Modules\Payment\Domain\DTOs\PaymentResponse;
use App\Modules\Payment\Domain\Enums\PaymentStatus;
use Illuminate\Support\Facades\Cache;

class GenericPayment implements PaymentGatewayInterface
{
    public function __construct(
        private readonly int $approveAfterSeconds = 30,
    ) {}

    public function createPayment(CreatePaymentData $data): PaymentResponse
    {
        $id = 'fake_'.bin2hex(random_bytes(8));
        $payload = [
            'created_at' => time(),
            'status' => PaymentStatus::Pending->value,
        ];
        Cache::put($this->cacheKey($id), $payload, now()->addDay());

        return new PaymentResponse(
            gatewayPaymentId: $id,
            paymentUrl: 'https://payment.test/'.$id,
            status: PaymentStatus::Pending,
        );
    }

    public function getPaymentStatus(string $paymentId): PaymentStatus
    {
        $payload = Cache::get($this->cacheKey($paymentId));
        if (! is_array($payload)) {
            return PaymentStatus::Cancelled;
        }

        $status = PaymentStatus::tryFrom((string) ($payload['status'] ?? '')) ?? PaymentStatus::Pending;
        if ($status === PaymentStatus::Approved) {
            return PaymentStatus::Approved;
        }

        $createdAt = (int) ($payload['created_at'] ?? 0);
        if ($createdAt > 0 && (time() - $createdAt) >= $this->approveAfterSeconds) {
            $payload['status'] = PaymentStatus::Approved->value;
            Cache::put($this->cacheKey($paymentId), $payload, now()->addDay());

            return PaymentStatus::Approved;
        }

        return PaymentStatus::Pending;
    }

    private function cacheKey(string $paymentId): string
    {
        return 'payment_gateway:generic:'.$paymentId;
    }
}
