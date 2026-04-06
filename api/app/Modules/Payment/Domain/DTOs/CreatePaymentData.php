<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\DTOs;

readonly class CreatePaymentData
{
    public function __construct(
        public int $invoiceId,
        public string $amount,
        public ?string $dueDate = null,
    ) {}
}
