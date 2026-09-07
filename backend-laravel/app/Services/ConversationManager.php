<?php

namespace App\Services;

use App\Models\Conversation;

class ConversationManager
{
    public function openForClient(int $clientId): Conversation
    {
        return Conversation::firstOrCreate([
            'client_id' => $clientId,
            'status' => config('crm.default_status'),
        ]);
    }
}