<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role', 20)->default('secretary');
            $table->boolean('active')->default(true);
        });
        Schema::table('conversations', function (Blueprint $table): void {
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::create('crm_access_tokens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        Schema::create('crm_audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 80);
            $table->string('entity_type', 80)->nullable();
            $table->string('entity_id', 80)->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_audit_logs');
        Schema::dropIfExists('crm_access_tokens');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['role', 'active']);
        });
        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('assigned_to');
        });
    }
};
