<?php

namespace App\Helpers;

class FormatHelper
{
    public static function compactText(string $value, int $length = 80): string
    {
        return strlen($value) > $length ? substr($value, 0, $length - 3) . '...' : $value;
    }
}