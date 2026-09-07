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
        $allowedOrigins = (array) ($config['allowed_origins'] ?? []);
        $allowedPatterns = (array) ($config['allowed_origins_patterns'] ?? []);
        $allowed = in_array($origin, $allowedOrigins, true);

        foreach ($allowedPatterns as $pattern) {
            if ($origin !== '' && preg_match($pattern, $origin) === 1) {
                $allowed = true;
                break;
            }
        }

        if ($request->isMethod('OPTIONS')) {
            $response = response('', 204);
        } else {
            $response = $next($request);
        }

        if ($allowed) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', implode(', ', (array) ($config['allowed_methods'] ?? ['*'])));
            $response->headers->set('Access-Control-Allow-Headers', implode(', ', (array) ($config['allowed_headers'] ?? ['*'])));
            $response->headers->set('Access-Control-Expose-Headers', implode(', ', (array) ($config['exposed_headers'] ?? [])));
            $response->headers->set('Access-Control-Max-Age', (string) ($config['max_age'] ?? 0));
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }
}