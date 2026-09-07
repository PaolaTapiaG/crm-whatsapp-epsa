<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('messages', 'whatsapp_message_id')) {
            Schema::table('messages', function (Blueprint $table): void {
                $table->string('whatsapp_message_id')->nullable()->unique()->after('conversation_id');
                $table->index(['conversation_id', 'created_at'], 'messages_conversation_created_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('messages', 'whatsapp_message_id')) {
            Schema::table('messages', function (Blueprint $table): void {
                $table->dropIndex('messages_conversation_created_index');
                $table->dropUnique(['whatsapp_message_id']);
                $table->dropColumn('whatsapp_message_id');
            });
        }
    }
};
