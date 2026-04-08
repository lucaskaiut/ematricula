<?php

declare(strict_types=1);

namespace App\Modules\Acl\Domain\Models;

use App\Models\User;
use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Core\Domain\Traits\HasCompany;
use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    /** @use HasFactory<RoleFactory> */
    use HasCompany, HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'permissions',
    ];

    protected static function newFactory(): RoleFactory
    {
        return RoleFactory::new();
    }

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function hasPermission(string $permission): bool
    {
        if (! in_array($permission, Permission::values(), true)) {
            return false;
        }

        /** @var list<string>|null $list */
        $list = $this->permissions;

        return is_array($list) && in_array($permission, $list, true);
    }

    /**
     * @param  list<string>  $permissions
     */
    public function syncPermissionsList(array $permissions): void
    {
        $allowed = Permission::values();
        $clean = array_values(array_unique(array_filter(
            $permissions,
            static fn (string $p): bool => in_array($p, $allowed, true)
        )));
        $this->permissions = $clean;
    }
}
