<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCors
{
    public function handle(Request $request, Closure $next): Response
{
    if ($request->isMethod('OPTIONS')) {
        return response('CORS TEST', 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', '*')
            ->header('Access-Control-Max-Age', '86400')
            ->header('Vary', 'Origin');
    }

    $response = $next($request);

    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', '*');
    $response->headers->set('Access-Control-Max-Age', '86400');
    $response->headers->set('Vary', 'Origin');

    return $response;
}
}
