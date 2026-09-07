<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    protected $fillable = ['meter_id', 'bill_number', 'amount', 'consumption', 'issue_date', 'due_date', 'status'];
    protected $casts = ['amount' => 'decimal:2', 'consumption' => 'decimal:2', 'issue_date' => 'date', 'due_date' => 'date'];
    public function meter() { return $this->belongsTo(Meter::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}