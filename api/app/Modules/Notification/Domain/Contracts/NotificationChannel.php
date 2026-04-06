<?php

declare(strict_types=1);

namespace App\Modules\Notification\Domain\Contracts;

use App\Modules\Notification\Domain\Dtos\OutboundNotification;

interface NotificationChannel
{
    public function handles(OutboundNotification $notification): bool;

    public function send(OutboundNotification $notification): void;
}
