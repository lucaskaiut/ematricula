<?php

declare(strict_types=1);

namespace App\Modules\Enrollment\Domain\Models;

use App\Models\User;
use App\Modules\ClassGroup\Domain\Models\ClassGroup;
use App\Modules\Core\Domain\Attributes\TracksUserAudit;
use App\Modules\Core\Domain\Observers\UserAuditObserver;
use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Enrollment\Domain\Enums\EnrollmentStatus;
use App\Modules\Person\Domain\Models\Person;
use App\Modules\Subscription\Domain\Enums\SubscriptionStatus;
use App\Modules\Subscription\Domain\Models\Subscription;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[ObservedBy([UserAuditObserver::class])]
#[TracksUserAudit]
class Enrollment extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'student_person_id',
        'class_group_id',
        'starts_on',
        'ends_on',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'status' => EnrollmentStatus::class,
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'student_person_id');
    }

    public function classGroup(): BelongsTo
    {
        return $this->belongsTo(ClassGroup::class, 'class_group_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)
            ->where('status', SubscriptionStatus::Active);
    }
}
