<?php

$configuredOrigins = array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
));

$defaultOrigins = [
    'https://crm-whatsapp-epsa.vercel.app',
    'https://crm-whatsapp-epsa-4m4cldgrc-andymndz2704-gmailcoms-projects.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
];

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // A deployed service may add a custom Vercel domain without opening the API to every origin.
    'allowed_origins' => array_values(array_unique(array_merge($defaultOrigins, $configuredOrigins))),
    'allowed_origins_patterns' => [
        '#^https://crm-whatsapp-epsa(?:-[a-z0-9-]+)*\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 86400,
    'supports_credentials' => false,
];
