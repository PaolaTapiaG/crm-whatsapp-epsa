<?php

namespace App\Services;

class QueueManager
{
    public function connection(): string
    {
        return (string) config('queue.default');
    }
}