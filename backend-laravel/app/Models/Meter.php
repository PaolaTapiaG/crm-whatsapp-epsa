<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Meter extends Model
{
    protected $fillable = ['client_id', 'zone_id', 'meter_number', 'type', 'current_reading', 'last_reading', 'last_reading_date', 'status'];
    protected $casts = ['current_reading' => 'decimal:2', 'last_reading' => 'decimal:2', 'last_reading_date' => 'date'];
    public function client() { return $this->belongsTo(Client::class); }
    public function zone() { return $this->belongsTo(Zone::class); }
    public function bills() { return $this->hasMany(Bill::class); }
}