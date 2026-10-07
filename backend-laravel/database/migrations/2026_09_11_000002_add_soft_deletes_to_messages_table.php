<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->timestamp('deleted_at')->nullable()->after('read_at');
            $table->unsignedBigInteger('deleted_by')->nullable()->after('deleted_at');
            $table->index(['conversation_id', 'deleted_at'], 'messages_conversation_deleted_index');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropIndex('messages_conversation_deleted_index');
            $table->dropColumn(['deleted_at', 'deleted_by']);
        });
    }
};