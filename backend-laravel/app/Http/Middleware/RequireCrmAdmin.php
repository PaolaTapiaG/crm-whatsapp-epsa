<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireCrmAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('crm.auth_enabled') && $request->user()?->role !== 'admin') {
            return response()->json(['success' => false, 'error' => 'Solo la administración puede realizar esta acción.'], 403);
        }
        return $next($request);
    }
}
