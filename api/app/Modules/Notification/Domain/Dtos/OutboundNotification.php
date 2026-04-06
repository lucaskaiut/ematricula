<?php

declare(strict_types=1);

namespace App\Modules\Notification\Domain\Dtos;

use App\Modules\Notification\Domain\Enums\NotificationType;

final readonly class OutboundNotification
{
    public function __construct(
        public NotificationType $type,
        public ?string $recipientEmail,
        public ?string $recipientName,
        public array $payload,
    ) {}
}
