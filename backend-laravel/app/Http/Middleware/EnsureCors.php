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
        $allowed = preg_match(
            '#^https://crm-whatsapp-epsa(?:-[a-z0-9-]+)?\\.vercel\\.app$#',
            $origin
        ) === 1;

        if (app()->environment('local') && preg_match('#^http://(localhost|127\\.0\\.0\\.1)(:\\d+)?$#', $origin) === 1) {
            $allowed = true;
        }

        $response = $request->isMethod('OPTIONS')
            ? response()->noContent(204)
            : $next($request);

        if (! $allowed) {
            return $response;
        }

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        $response->headers->set('Access-Control-Expose-Headers', 'Authorization');
        $response->headers->set('Access-Control-Max-Age', '86400');
        $response->headers->set('Vary', 'Origin');

        return $response;
    }
}
