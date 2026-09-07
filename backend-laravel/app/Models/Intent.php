<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Intent extends Model
{
    protected $fillable = [
        'name',
        'description',
        'keywords',
        'response_template',
        'requires_action',
        'priority',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'is_active' => 'boolean',
            'priority' => 'integer',
        ];
    }
}
