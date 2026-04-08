<?php

use App\Models\User;
use App\Modules\Acl\Domain\Enums\Permission;
use App\Modules\Acl\Domain\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->json('permissions');
            $table->timestamps();

            $table->unique(['company_id', 'name']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('company_id')->constrained('roles')->restrictOnDelete();
        });

        $all = array_map(static fn (Permission $p) => $p->value, Permission::cases());

        $companyIds = User::query()->withoutGlobalScopes()->distinct()->pluck('company_id')->filter();

        foreach ($companyIds as $companyId) {
            $role = Role::query()->withoutGlobalScopes()->create([
                'company_id' => $companyId,
                'name' => 'Administrador',
                'description' => 'Acesso total ao sistema',
                'permissions' => $all,
            ]);

            User::query()->withoutGlobalScopes()->where('company_id', $companyId)->update(['role_id' => $role->id]);
        }

        if (! User::query()->withoutGlobalScopes()->whereNull('role_id')->exists()) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['role_id']);
            });
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id')->nullable(false)->change();
            });
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('role_id')->references('id')->on('roles')->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
        });

        Schema::dropIfExists('roles');
    }
};
