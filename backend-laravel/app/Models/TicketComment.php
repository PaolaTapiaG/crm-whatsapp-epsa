<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketComment extends Model
{
    protected $fillable = ['ticket_id', 'user_id', 'comment', 'is_internal', 'attachments', 'metadata'];
    protected $casts = ['is_internal' => 'boolean', 'attachments' => 'array', 'metadata' => 'array'];
    public function ticket() { return $this->belongsTo(Ticket::class); }
    public function user() { return $this->belongsTo(User::class); }
}