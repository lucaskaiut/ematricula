<?php

declare(strict_types=1);

namespace App\Modules\Setting\Domain\Models;

use App\Modules\Core\Domain\Traits\HasCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantSetting extends Model
{
    use HasCompany;

    protected $fillable = [
        'company_id',
        'setting_id',
        'value',
    ];

    public function setting(): BelongsTo
    {
        return $this->belongsTo(Setting::class, 'setting_id');
    }
}
