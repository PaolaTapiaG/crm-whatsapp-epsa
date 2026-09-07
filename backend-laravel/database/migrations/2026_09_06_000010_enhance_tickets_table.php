<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->string('ticket_number')->nullable()->after('id');
            $table->foreignId('meter_id')->nullable()->after('conversation_id')->constrained('meters')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->after('meter_id')->constrained('zones')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->after('assigned_to')->constrained('users')->nullOnDelete();
            $table->timestamp('closed_at')->nullable()->after('resolved_at');
            $table->unsignedInteger('sla_hours')->default(24)->after('closed_at');
            $table->index(['status', 'priority']);
        });

        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->boolean('is_internal')->default(false)->after('comment');
            $table->json('attachments')->nullable()->after('is_internal');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->dropColumn(['is_internal', 'attachments']);
        });
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['meter_id']);
            $table->dropForeign(['zone_id']);
            $table->dropForeign(['created_by']);
            $table->dropIndex(['status', 'priority']);
            $table->dropColumn(['ticket_number', 'meter_id', 'zone_id', 'created_by', 'closed_at', 'sla_hours']);
        });
    }
};