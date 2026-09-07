<?php

namespace App\Modules\CRM\Services;

use App\Models\Client;

class ClientService
{
    public function create(array $attributes): Client
    {
        return Client::create($attributes);
    }
}