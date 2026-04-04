<?php

declare(strict_types=1);

namespace App\Modules\ClassGroup\Domain\Models;

use App\Models\User;
use App\Modules\Core\Domain\Attributes\TracksUserAudit;
use App\Modules\Core\Domain\Observers\UserAuditObserver;
use App\Modules\Core\Domain\Traits\HasCompany;
use App\Modules\Modality\Domain\Models\Modality;
use App\Modules\Person\Domain\Models\Person;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([UserAuditObserver::class])]
#[TracksUserAudit]
class ClassGroup extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'name',
        'modality_id',
        'teacher_person_id',
        'max_capacity',
        'weekdays',
        'starts_at',
        'ends_at',
    ];

    protected function name(): Attribute
    {
        return Attribute::make(
            set: fn (mixed $value) => is_string($value) ? trim($value) : $value,
        );
    }

    protected function weekdays(): Attribute
    {
        return Attribute::make(
            set: function (mixed $value) {
                if (is_array($value)) {
                    return $this->encodeWeekdaysArray($value);
                }
                if (is_string($value)) {
                    $decoded = json_decode($value, true);
                    if (is_array($decoded)) {
                        return $this->encodeWeekdaysArray($decoded);
                    }

                    return trim($value);
                }

                return $value;
            },
        );
    }

    /**
     * @param  array<int, mixed>  $days
     */
    private function encodeWeekdaysArray(array $days): string
    {
        $ints = array_map(static fn ($x) => (int) $x, $days);
        $sorted = array_values(array_unique($ints));
        sort($sorted);

        return json_encode($sorted);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function modality(): BelongsTo
    {
        return $this->belongsTo(Modality::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'teacher_person_id');
    }
}
