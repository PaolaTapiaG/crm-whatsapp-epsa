<?php

namespace App\Providers;

use App\Services\WhatsAppService;
use App\Services\MessageProcessor;
use App\Services\IntentAnalyzer;
use App\Services\ResponseGenerator;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

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
        RateLimiter::for('crm-api', function (Request $request) {
            return Limit::perMinute((int) env('CRM_RATE_LIMIT_PER_MINUTE', 120))
                ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip()));
        });

        RateLimiter::for('whatsapp-webhook', function (Request $request) {
            return Limit::perMinute((int) env('WHATSAPP_WEBHOOK_RATE_LIMIT', 600))
                ->by((string) ($request->ip() ?: 'whatsapp'));
        });
    }
}
