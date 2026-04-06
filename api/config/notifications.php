<?php

declare(strict_types=1);

use App\Modules\Notification\Infrastructure\Channels\EmailNotificationChannel;

return [
    'channels' => [
        EmailNotificationChannel::class,
    ],
];
