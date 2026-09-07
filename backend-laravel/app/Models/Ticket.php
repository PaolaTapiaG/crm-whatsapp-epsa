<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tickets';

    protected $fillable = [
        'client_id',
        'conversation_id',
        'meter_id',
        'zone_id',
        'ticket_number',
        'subject',
        'description',
        'category',
        'priority',
        'status',
        'assigned_to',
        'created_by',
        'sla_hours',
        'metadata',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'sla_hours' => 'integer',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function meter() { return $this->belongsTo(Meter::class); }
    public function zone() { return $this->belongsTo(Zone::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }

    public function comments()
    {
        return $this->hasMany(TicketComment::class);
    }

    public function history() { return $this->hasMany(TicketHistory::class); }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['open', 'assigned', 'in_progress']);
    }
}
