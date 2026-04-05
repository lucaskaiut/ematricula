<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Company\Domain\Runner\CompanyRunner;
use App\Modules\Subscription\Domain\Enums\SubscriptionStatus;
use App\Modules\Subscription\Domain\Models\Subscription;
use App\Modules\Subscription\Domain\Services\SubscriptionRecurrenceService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class GenerateRecurringInvoicesCommand extends Command
{
    protected $signature = 'billing:generate-recurring-invoices {--date= : Data de referência Y-m-d (padrão: hoje)}';

    protected $description = 'Gera faturas quando faltar até N dias para o vencimento (config billing.invoice_generate_days_before_due)';

    public function handle(SubscriptionRecurrenceService $recurrence): int
    {
        $dateOpt = $this->option('date');
        $today = CarbonImmutable::parse(
            is_string($dateOpt) && $dateOpt !== ''
                ? $dateOpt
                : now()->toDateString()
        )->startOfDay();

        $threshold = $today->addDays($recurrence->invoiceDaysBeforeDue())->toDateString();

        CompanyRunner::forAll(function () use ($recurrence, $today, $threshold): void {
            Subscription::query()
                ->where('status', SubscriptionStatus::Active)
                ->whereDate('next_billing_at', '<=', $threshold)
                ->orderBy('id')
                ->chunkById(100, function ($subscriptions) use ($recurrence, $today): void {
                    foreach ($subscriptions as $subscription) {
                        $recurrence->runAutomaticForSubscription($subscription, $today);
                    }
                });
        });

        return self::SUCCESS;
    }
}
