<?php

declare(strict_types=1);

namespace App\Modules\Plan\Domain\Models;

use App\Models\User;
use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Core\Domain\Attributes\TracksUserAudit;
use App\Modules\Core\Domain\Observers\UserAuditObserver;
use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Plan\Domain\Enums\BillingCycle;
use App\Modules\Subscription\Domain\Models\Subscription;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([UserAuditObserver::class])]
#[TracksUserAudit]
class Plan extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'name',
        'price',
        'billing_cycle',
        'billing_interval',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'billing_interval' => 'integer',
            'billing_cycle' => BillingCycle::class,
        ];
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value) => is_string($value) ? trim($value) : $value,
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function classGroups(): BelongsToMany
    {
        return $this->belongsToMany(ClassGroup::class, 'class_group_plans')
            ->withTimestamps();
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
