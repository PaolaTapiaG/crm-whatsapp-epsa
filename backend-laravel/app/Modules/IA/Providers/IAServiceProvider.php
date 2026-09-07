<?php

namespace App\Modules\IA\Providers;

use Illuminate\Support\ServiceProvider;

class IAServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');
    }
}