<?php

namespace App\Modules\WhatsApp\Services;

class WhatsAppService
{
    public function endpoint(string $path = ''): string
    {
        return rtrim((string) config('whatsapp.api_url'), '/') . '/' . ltrim($path, '/');
    }
}