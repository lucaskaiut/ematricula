<?php

declare(strict_types=1);

namespace App\Modules\Subscription\Domain\Models;

use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Enrollment\Domain\Models\Enrollment;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Plan\Domain\Models\Plan;
use App\Modules\Subscription\Domain\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'enrollment_id',
        'plan_id',
        'price',
        'billing_cycle',
        'billing_interval',
        'started_at',
        'next_billing_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'billing_interval' => 'integer',
            'started_at' => 'date',
            'next_billing_at' => 'date',
            'status' => SubscriptionStatus::class,
        ];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
