<?php

namespace App\Http\Middleware;

use App\Models\CrmAuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditCrmAction
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if (config('crm.auth_enabled') && !$request->isMethod('GET') && $request->user()) {
            $route = $request->route();
            $parameters = $route?->parameters() ?? [];
            CrmAuditLog::create([
                'user_id' => $request->user()->id,
                'action' => $request->method() . ' ' . ($route?->uri() ?? $request->path()),
                'entity_type' => count($parameters) ? (string) array_key_first($parameters) : null,
                'entity_id' => count($parameters) ? (string) reset($parameters) : null,
                'details' => ['status' => $response->getStatusCode()],
            ]);
        }
        return $response;
    }
}
