<?php

namespace App\Services;

class WhatsAppWebhookService
{
    public function verify(string $mode, string $token, string $challenge): ?string
    {
        return $mode === 'subscribe' && hash_equals((string) config('whatsapp.verify_token'), $token)
            ? $challenge
            : null;
    }
}