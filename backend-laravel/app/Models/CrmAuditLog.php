<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmAuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'entity_type', 'entity_id', 'details'];

    protected $casts = ['details' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
