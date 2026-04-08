<?php

declare(strict_types=1);

namespace App\Modules\Payment\Domain\Models;

use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Invoice\Domain\Models\Invoice;
use App\Modules\Payment\Domain\Enums\PaymentStatus;
use App\Modules\Payment\Domain\Observers\PaymentObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([PaymentObserver::class])]
class Payment extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'invoice_id',
        'gateway',
        'gateway_payment_id',
        'status',
        'payment_url',
    ];

    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
