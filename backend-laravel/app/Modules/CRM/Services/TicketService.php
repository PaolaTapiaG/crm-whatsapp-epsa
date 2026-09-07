<?php

namespace App\Modules\CRM\Services;

class TicketService
{
    public function statusOptions(): array
    {
        return ['open', 'pending', 'closed'];
    }
}