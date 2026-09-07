<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = ['bill_id', 'amount', 'method', 'reference', 'payment_date', 'status'];
    protected $casts = ['amount' => 'decimal:2', 'payment_date' => 'date'];
    public function bill() { return $this->belongsTo(Bill::class); }
}