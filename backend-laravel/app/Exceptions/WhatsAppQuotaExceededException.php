<?php

namespace App\Exceptions;

use RuntimeException;

class WhatsAppQuotaExceededException extends RuntimeException
{
    public function __construct(public readonly array $quota)
    {
        parent::__construct('La cuota gratuita mensual de WhatsApp fue superada.', 402);
    }
}
