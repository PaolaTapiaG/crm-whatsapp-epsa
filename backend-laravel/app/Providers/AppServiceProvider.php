<?php

namespace App\Providers;

use App\Services\WhatsAppService;
use App\Services\MessageProcessor;
use App\Services\IntentAnalyzer;
use App\Services\ResponseGenerator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Registrar servicios
        $this->app->singleton(MessageProcessor::class, function ($app) {
            return new MessageProcessor();
        });

        $this->app->singleton(IntentAnalyzer::class, function ($app) {
            return new IntentAnalyzer();
        });

        $this->app->singleton(ResponseGenerator::class, function ($app) {
            return new ResponseGenerator();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
