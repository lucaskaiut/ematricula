<?php

declare(strict_types=1);

namespace App\Modules\Invoice\Domain\Models;

use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Invoice\Domain\Enums\InvoiceStatus;
use App\Modules\Invoice\Domain\Observers\InvoiceObserver;
use App\Modules\Payment\Domain\Models\Payment;
use App\Modules\Subscription\Domain\Models\Subscription;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([InvoiceObserver::class])]
class Invoice extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'subscription_id',
        'amount',
        'due_date',
        'status',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'status' => InvoiceStatus::class,
            'paid_at' => 'datetime',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
