<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'whatsapp_number',
        'name',
        'email',
        'phone',
        'address',
        'language',
        'status',
        'metadata',
        'last_interaction_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_interaction_at' => 'datetime',
    ];

    // Relaciones
    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function meters()
    {
        return $this->hasMany(Meter::class);
    }

    public function messages()
    {
        return $this->hasManyThrough(Message::class, Conversation::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByWhatsApp($query, $number)
    {
        return $query->where('whatsapp_number', $number);
    }
}