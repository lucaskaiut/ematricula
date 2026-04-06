<?php

declare(strict_types=1);

namespace App\Modules\Notification\Domain\Services;

use App\Modules\Notification\Domain\Contracts\NotificationChannel;
use App\Modules\Notification\Domain\Dtos\OutboundNotification;

final class NotificationHub
{
    /**
     * @param  list<NotificationChannel>  $channels
     */
    public function __construct(
        private readonly array $channels,
    ) {}

    public function dispatch(OutboundNotification $notification): void
    {
        foreach ($this->channels as $channel) {
            if ($channel->handles($notification)) {
                $channel->send($notification);
            }
        }
    }
}
