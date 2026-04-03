<?php

declare(strict_types=1);

namespace App\Modules\Modality\Domain\Models;

use App\Models\User;
use App\Modules\Core\Domain\Attributes\TracksUserAudit;
use App\Modules\Core\Domain\Observers\UserAuditObserver;
use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Person\Domain\Models\Person;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[ObservedBy([UserAuditObserver::class])]
#[TracksUserAudit]
class Modality extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'name',
        'description',
    ];

    protected function name(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value) => is_string($value) ? trim($value) : $value,
        );
    }

    protected function description(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value) => $value === '' || $value === null ? null : $value,
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

    public function people(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'modality_person')
            ->withTimestamps();
    }
}
