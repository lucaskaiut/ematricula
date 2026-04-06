<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Notification\Domain\Contracts\NotificationChannel;
use App\Modules\Notification\Domain\Services\NotificationHub;
use Illuminate\Support\ServiceProvider;

class NotificationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(NotificationHub::class, function ($app) {
            $classes = (array) config('notifications.channels', []);
            $channels = [];
            foreach ($classes as $class) {
                if (! is_string($class) || ! class_exists($class)) {
                    continue;
                }
                $instance = $app->make($class);
                if ($instance instanceof NotificationChannel) {
                    $channels[] = $instance;
                }
            }

            return new NotificationHub($channels);
        });
    }
}
