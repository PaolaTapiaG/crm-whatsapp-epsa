<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCors
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = (string) $request->headers->get('Origin');
        $config = (array) config('cors', []);
        $allowed = in_array('*', (array) ($config['allowed_origins'] ?? []), true);

        if ($request->isMethod('OPTIONS')) {
    return response('CORS TEST', 204)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', '*')
        ->header('Access-Control-Max-Age', '86400')
        ->header('Vary', 'Origin');
} else {
            $response = $next($request);
        }

        if ($allowed) {
            $response->headers->set('Access-Control-Allow-Origin', '*');
            $response->headers->set('Access-Control-Allow-Methods', implode(', ', (array) ($config['allowed_methods'] ?? ['*'])));
            $response->headers->set('Access-Control-Allow-Headers', implode(', ', (array) ($config['allowed_headers'] ?? ['*'])));
            $response->headers->set('Access-Control-Expose-Headers', implode(', ', (array) ($config['exposed_headers'] ?? [])));
            $response->headers->set('Access-Control-Max-Age', (string) ($config['max_age'] ?? 0));
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }
}
