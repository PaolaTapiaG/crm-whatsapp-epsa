<?php

namespace App\Models;

use App\Events\MessageCreated;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'sender',
        'sender_type',
        'sender_id',
        'message_type',
        'text',
        'content',
        'intent',
        'sentiment',
        'confidence',
        'metadata',
        'whatsapp_message_id',
        'ai_generated',
        'internal',
        'read_at',
        'deleted_by',
    ];

    protected $casts = [
        'metadata' => 'array',
        'ai_generated' => 'boolean',
        'internal' => 'boolean',
        'sender_id' => 'integer',
        'read_at' => 'datetime',
        'deleted_at' => 'datetime',
        'deleted_by' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $message): void {
            $message->internal = (bool) ($message->internal ?? false);
            $message->content ??= $message->text;
            $message->text ??= $message->content;
            $message->sender_type ??= match ($message->sender) {
                'user' => 'customer',
                'bot' => 'ai',
                'human' => 'operator',
                'system' => 'system',
                default => $message->internal ? 'operator' : 'system',
            };
            $message->message_type ??= data_get($message->metadata, 'kind', 'text');
            $message->ai_generated ??= $message->sender_type === 'ai';
        });

        static::created(function (self $message): void {
            try {
                MessageCreated::dispatch($message);
            } catch (\Throwable $exception) {
                report($exception);
            }
        });
    }

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

    public function scopeExternal($query)
    {
        return $query->where('internal', false);
    }

    public function scopeInternal($query)
    {
        return $query->where('internal', true);
    }
}
