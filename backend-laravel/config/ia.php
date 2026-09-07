<?php

return [
    'url' => env('IA_SERVICE_URL', 'http://ai-service:8001'),
    'timeout' => (int) env('IA_SERVICE_TIMEOUT', 10),
];