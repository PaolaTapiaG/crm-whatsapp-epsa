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
    'development_mode' => env('WHATSAPP_DEV_MODE', true),
    'simulator_url' => env('WHATSAPP_SIMULATOR_URL', 'http://localhost:3000'),
];