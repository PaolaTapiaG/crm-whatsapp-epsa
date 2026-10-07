<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmAccessToken extends Model
{
    protected $fillable = ['user_id', 'token_hash', 'expires_at'];

    protected $casts = ['expires_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
