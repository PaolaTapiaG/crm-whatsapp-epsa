<?php

namespace App\Helpers;

class WhatsAppHelper
{
    public static function normalizePhone(string $phone): string
    {
        return preg_replace('/[^0-9+]/', '', $phone) ?? '';
    }
}