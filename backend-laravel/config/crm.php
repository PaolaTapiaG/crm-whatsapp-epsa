<?php

return [
    'name' => 'Water CRM IA',
    'version' => '0.1.0',

    'business' => [
        'type' => 'water_service',
        'timezone' => 'America/La_Paz',
        'currency' => 'BOB',
        'language' => 'es',
    ],

    'conversations' => [
        'auto_close_hours' => 24,
        'max_active_per_client' => 3,
        'require_human_approval' => false,
    ],

    'notifications' => [
        'email' => true,
        'slack' => false,
        'telegram' => false,
    ],

    'auth_enabled' => (bool) env('CRM_AUTH_ENABLED', false),
    'session_hours' => (int) env('CRM_SESSION_HOURS', 12),
];
