<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://crm-whatsapp-epsa.vercel.app',
        'https://crm-whatsapp-epsa-4m4cldgrc-andymndz2704-gmailcoms-projects.vercel.app',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
    ],
    'allowed_origins_patterns' => [
        '#^https://crm-whatsapp-epsa(?:-[a-z0-9-]+)*\.vercel\.app$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => ['Authorization'],
    'max_age' => 86400,
    'supports_credentials' => false,
];