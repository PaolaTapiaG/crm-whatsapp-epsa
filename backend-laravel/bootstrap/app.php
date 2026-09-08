
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        App\Modules\WhatsApp\Providers\WhatsAppServiceProvider::class,
        App\Modules\CRM\Providers\CRMServiceProvider::class,
        App\Modules\IA\Providers\IAServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Registrar CORS para TODAS las rutas
        $middleware->append(\App\Http\Middleware\EnsureCors::class);
        
        // También para el grupo API específicamente
        $middleware->api(prepend: [
            \App\Http\Middleware\EnsureCors::class,
        ]);
        
        // Y para web
        $middleware->web(prepend: [
            \App\Http\Middleware\EnsureCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
