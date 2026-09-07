<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Zone extends Model
{
    protected $fillable = ['name', 'description', 'has_water', 'has_maintenance', 'maintenance_date'];
    protected $casts = ['has_water' => 'boolean', 'has_maintenance' => 'boolean', 'maintenance_date' => 'date'];
    public function meters() { return $this->hasMany(Meter::class); }
}