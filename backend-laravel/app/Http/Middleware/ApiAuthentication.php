<?php

namespace App\Http\Middleware;

use App\Services\CrmAuth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiAuthentication
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (config('crm.auth_enabled')) {
            $user = app(CrmAuth::class)->userFromToken($request->bearerToken());
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'Inicia sesión para continuar.'], 401);
            }
            $request->setUserResolver(fn () => $user);
            return $next($request);
        }

        $configuredToken = (string) config('services.crm.api_token');
        if ($configuredToken === '') {
            if (app()->environment('local')) {
                return $next($request);
            }

            return response()->json([
                'success' => false,
                'error' => 'CRM API authentication is not configured.',
            ], 503);
        }

        $providedToken = (string) $request->bearerToken();
        if ($providedToken === '' || !hash_equals($configuredToken, $providedToken)) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthenticated.',
            ], 401);
        }

        return $next($request);
    }
}
