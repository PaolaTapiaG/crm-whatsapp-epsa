<?php

namespace App\Modules\IA\Services;

class IntentAnalyzer
{
    public function analyze(string $message): array
    {
        return ['message' => $message, 'intent' => null, 'confidence' => 0.0];
    }
}