<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->string('sender_type')->nullable()->after('conversation_id');
            $table->unsignedBigInteger('sender_id')->nullable()->after('sender_type');
            $table->string('message_type')->default('text')->after('sender_id');
            $table->text('content')->nullable()->after('message_type');
            $table->boolean('ai_generated')->default(false)->after('content');
            $table->boolean('internal')->default(false)->after('ai_generated');
            $table->index(['conversation_id', 'internal', 'created_at'], 'messages_conversation_internal_created_index');
            $table->index(['sender_type', 'sender_id'], 'messages_sender_index');
        });

        DB::table('messages')->update([
            'sender_type' => DB::raw("CASE sender WHEN 'user' THEN 'customer' WHEN 'bot' THEN 'ai' WHEN 'human' THEN 'operator' WHEN 'system' THEN 'system' ELSE 'system' END"),
            'content' => DB::raw('text'),
            'ai_generated' => DB::raw("CASE WHEN sender = 'bot' THEN 1 ELSE 0 END"),
        ]);
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropIndex('messages_conversation_internal_created_index');
            $table->dropIndex('messages_sender_index');
            $table->dropColumn(['sender_type', 'sender_id', 'message_type', 'content', 'ai_generated', 'internal']);
        });
    }
};