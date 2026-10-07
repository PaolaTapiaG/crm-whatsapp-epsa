<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Conversation $conversation)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversations.' . $this->conversation->id)];
    }

    public function broadcastAs(): string
    {
        return 'conversation.status-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversation->id,
            'status' => $this->conversation->status,
            'priority' => $this->conversation->priority,
        ];
    }
}