<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('people', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('full_name');
            $table->date('birth_date');
            $table->string('cpf', 11)->nullable();
            $table->string('phone', 20);
            $table->string('email');
            $table->foreignId('guardian_person_id')->nullable()->constrained('people')->nullOnDelete();
            $table->string('status', 32);
            $table->text('notes')->nullable();
            $table->string('profile', 32);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['company_id', 'email', 'profile']);
            $table->unique(['company_id', 'cpf', 'profile']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('people');
    }
};
