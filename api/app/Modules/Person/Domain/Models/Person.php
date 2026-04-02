<?php

declare(strict_types=1);

namespace App\Modules\Person\Domain\Models;

use App\Models\User;
use App\Modules\Core\Domain\Attributes\TracksUserAudit;
use App\Modules\Core\Domain\Observers\UserAuditObserver;
use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Person\Domain\Enums\PersonProfile;
use App\Modules\Person\Domain\Enums\PersonStatus;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([UserAuditObserver::class])]
#[TracksUserAudit]
#[Table('people')]
class Person extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'full_name',
        'birth_date',
        'cpf',
        'phone',
        'email',
        'guardian_person_id',
        'status',
        'notes',
        'profile',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'profile' => PersonProfile::class,
            'status' => PersonStatus::class,
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value) => is_string($value)
                ? trim(preg_replace('/\s+/u', ' ', $value) ?? '')
                : $value,
        );
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value) => is_string($value) ? strtolower(trim($value)) : $value,
        );
    }

    protected function cpf(): Attribute
    {
        return Attribute::make(
            set: function (mixed $value) {
                if ($value === null || $value === '') {
                    return null;
                }
                if (! is_string($value)) {
                    return $value;
                }

                $digits = preg_replace('/\D/', '', $value) ?? '';

                return $digits !== '' ? $digits : null;
            },
        );
    }

    protected function phone(): Attribute
    {
        return Attribute::make(
            set: function (mixed $value) {
                if (! is_string($value)) {
                    return $value;
                }

                return preg_replace('/\D/', '', $value) ?? '';
            },
        );
    }

    protected function notes(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value) => $value === '' || $value === null ? null : $value,
        );
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(self::class, 'guardian_person_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function isMinor(): bool
    {
        return $this->birth_date->gt(today()->subYears(18));
    }
}
