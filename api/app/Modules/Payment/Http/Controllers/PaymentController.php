<?php

declare(strict_types=1);

namespace App\Modules\Payment\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Payment\Domain\Models\Payment;
use App\Modules\Payment\Domain\Services\PaymentService;
use App\Modules\Payment\Http\Requests\PaymentStoreRequest;
use App\Modules\Payment\Http\Resources\PaymentResource;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    use ControllerTrait;

    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function store(Invoice $invoice, PaymentStoreRequest $request): JsonResponse
    {
        $payment = $this->db()->transaction(
            fn () => $this->paymentService->create(
                $invoice,
                (string) $request->validated('payment_method'),
            )
        );

        return (new PaymentResource($payment))
            ->response()
            ->setStatusCode(201);
    }

    public function syncStatus(Payment $payment): JsonResponse
    {
        $this->db()->transaction(
            fn () => $this->paymentService->getStatus($payment)
        );

        return (new PaymentResource($payment->fresh()))->response();
    }
}
