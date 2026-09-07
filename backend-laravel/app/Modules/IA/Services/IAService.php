<?php

namespace App\Modules\IA\Services;

class IAService
{
    public function serviceUrl(): string
    {
        return (string) config('ia.url');
    }
}