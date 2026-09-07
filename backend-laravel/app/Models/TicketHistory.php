<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketHistory extends Model
{
    protected $table = 'ticket_history';
    protected $fillable = ['ticket_id', 'user_id', 'action', 'from_status', 'to_status', 'changes'];
    protected $casts = ['changes' => 'array'];
    public function ticket() { return $this->belongsTo(Ticket::class); }
    public function user() { return $this->belongsTo(User::class); }
}