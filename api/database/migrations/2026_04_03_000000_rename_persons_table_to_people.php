<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('persons') && ! Schema::hasTable('people')) {
            Schema::rename('persons', 'people');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('people') && ! Schema::hasTable('persons')) {
            Schema::rename('people', 'persons');
        }
    }
};
