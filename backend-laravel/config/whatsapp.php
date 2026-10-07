<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WhatsApp Business API Configuration
    |--------------------------------------------------------------------------
    */
    'api_url' => env('WHATSAPP_API_URL', 'https://graph.facebook.com/v17.0'),
    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
    'app_id' => env('WHATSAPP_APP_ID', env('META_APP_ID')),
    'app_secret' => env('WHATSAPP_APP_SECRET', env('META_APP_SECRET')),
    'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
    'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
    'verify_token' => env('WHATSAPP_VERIFY_TOKEN', 'development_token'),
    
    /*
    |--------------------------------------------------------------------------
    | Message Settings
    |--------------------------------------------------------------------------
    */
    'default_language' => 'es',
    'max_message_length' => 4096,
    'typing_indicator' => true,
    
    /*
    |--------------------------------------------------------------------------
    | Development Mode
    |--------------------------------------------------------------------------
    */
    'development_mode' => env('WHATSAPP_DEV_MODE', false),
    'simulator_url' => env('WHATSAPP_SIMULATOR_URL', 'http://localhost:3000'),

    /*
    |--------------------------------------------------------------------------
    | Monthly free service-message quota guard
    |--------------------------------------------------------------------------
    |
    | Meta's official billing remains the source of truth. This guard estimates
    | monthly usage from outgoing CRM messages and warns before the free tier is
    | exhausted. Set emergency_mode to "monitor" to warn without blocking.
    |
    */
    'quota' => [
        'free_service_messages' => (int) env('WHATSAPP_FREE_SERVICE_MESSAGES', 1000),
        'warning_threshold' => (int) env('WHATSAPP_QUOTA_WARNING_THRESHOLD', 850),
        'critical_threshold' => (int) env('WHATSAPP_QUOTA_CRITICAL_THRESHOLD', 950),
        'emergency_mode' => env('WHATSAPP_QUOTA_EMERGENCY_MODE', 'block_auto'),
    ],
];
