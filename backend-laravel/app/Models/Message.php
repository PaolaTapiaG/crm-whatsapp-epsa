<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender',
        'text',
        'intent',
        'sentiment',
        'confidence',
        'metadata',
        'whatsapp_message_id',
        'read_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'read_at' => 'datetime',
    ];

    // Relaciones
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    // Scopes
    public function scopeFromUser($query)
    {
        return $query->where('sender', 'user');
    }

    public function scopeFromBot($query)
    {
        return $query->where('sender', 'bot');
    }
}
