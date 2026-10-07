<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWhatsAppWebhook
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->isMethod('POST')) {
            return $next($request);
        }

        $appSecret = (string) config('whatsapp.app_secret');
        if ($appSecret === '') {
            return config('whatsapp.development_mode')
                ? $next($request)
                : response()->json(['success' => false, 'error' => 'Webhook signature is not configured.'], 503);
        }

        $signature = (string) $request->header('X-Hub-Signature-256');
        $expected = 'sha256=' . hash_hmac('sha256', $request->getContent(), $appSecret);
        if ($signature === '' || !hash_equals($expected, $signature)) {
            return response()->json(['success' => false, 'error' => 'Invalid webhook signature.'], 403);
        }

        return $next($request);
    }
}
