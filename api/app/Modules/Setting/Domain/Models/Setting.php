<?php

declare(strict_types=1);

namespace App\Modules\Setting\Domain\Models;

use App\Modules\Setting\Domain\Enums\SettingType;
use App\Modules\Setting\Domain\Observers\SettingObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([SettingObserver::class])]
class Setting extends Model
{
    protected $fillable = [
        'key',
        'label',
        'description',
        'type',
        'default_value',
        'options',
        'group',
    ];

    protected function casts(): array
    {
        return [
            'type' => SettingType::class,
            'options' => 'array',
        ];
    }

    public function tenantSettings(): HasMany
    {
        return $this->hasMany(TenantSetting::class, 'setting_id');
    }
}
