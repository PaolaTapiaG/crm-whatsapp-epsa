
<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🧪 Iniciando pruebas del WhatsAppService\n";
echo str_repeat("=", 50) . "\n\n";

// 1. Probar IntentAnalyzer
echo "1️⃣ Probando IntentAnalyzer\n";
echo str_repeat("-", 30) . "\n";

$analyzer = app(App\Services\IntentAnalyzer::class);

$testMessages = [
    'Hola, buenos días',
    'Quiero saber cuánto debo de mi factura',
    'Tengo una fuga de agua en mi casa',
    'No tengo agua desde ayer',
    'Estoy muy enojado por el mal servicio',
    'Quiero contratar un nuevo servicio',
    'Gracias, hasta luego'
];

foreach ($testMessages as $message) {
    $result = $analyzer->analyze($message);
    echo "Mensaje: \"$message\"\n";
    echo "  Intención: {$result['intent']}\n";
    echo "  Confianza: {$result['confidence']}\n";
    echo "  Sentimiento: {$result['sentiment']}\n";
    echo "  Acción: {$result['requires_action']}\n\n";
}

// 2. Probar ResponseGenerator
echo "2️⃣ Probando ResponseGenerator\n";
echo str_repeat("-", 30) . "\n";

$generator = app(App\Services\ResponseGenerator::class);
$client = App\Models\Client::first();

if ($client) {
    $conversation = $client->conversations()->firstOrCreate(
        ['session_id' => 'test-response-generator'],
        [
            'status' => 'active',
            'channel' => 'whatsapp',
            'priority' => 'normal',
        ],
    );

    $analysis = [
        'intent' => 'saludo',
        'confidence' => 0.95,
        'sentiment' => 0.5,
        'requires_action' => 'none'
    ];
    
    $response = $generator->generate($client, $conversation, 'hola', $analysis);
    echo "Cliente: {$client->name}\n";
    echo "Respuesta: $response\n\n";
}

// 3. Probar WhatsAppService completo
echo "3️⃣ Probando WhatsAppService completo\n";
echo str_repeat("-", 30) . "\n";

$service = app(App\Services\WhatsAppService::class);

$testCases = [
    [
        'from' => '+59170000001',
        'text' => 'Hola, necesito ayuda con mi servicio',
        'session_id' => 'test-session-1',
        'name' => 'Juan Pérez'
    ],
    [
        'from' => '+59170000001',
        'text' => 'Tengo una fuga de agua en mi baño',
        'session_id' => 'test-session-1',
    ],
    [
        'from' => '+59170000002',
        'text' => 'Quiero saber mi saldo pendiente',
        'session_id' => 'test-session-2',
        'name' => 'María García'
    ],
];

foreach ($testCases as $testCase) {
    echo "Procesando: \"{$testCase['text']}\"\n";
    $result = $service->processIncomingMessage($testCase);
    
    if ($result['success']) {
        echo "  ✅ Éxito\n";
        echo "  Respuesta: {$result['response']}\n";
        echo "  Intención: {$result['analysis']['intent']}\n";
        echo "  Conversación ID: {$result['conversation_id']}\n";
    } else {
        echo "  ❌ Error: {$result['error']}\n";
    }
    echo "\n";
}

// 4. Verificar resultados
echo "4️⃣ Verificando resultados en BD\n";
echo str_repeat("-", 30) . "\n";

$conversations = App\Models\Conversation::whereIn('session_id', ['test-session-1', 'test-session-2'])
    ->with(['messages', 'client'])
    ->get();

foreach ($conversations as $conversation) {
    echo "Conversación: {$conversation->session_id}\n";
    echo "Cliente: {$conversation->client->name}\n";
    echo "Estado: {$conversation->status}\n";
    echo "Prioridad: {$conversation->priority}\n";
    echo "Mensajes:\n";
    
    foreach ($conversation->messages as $message) {
        echo "  [{$message->sender}] {$message->text}\n";
        echo "    Intent: {$message->intent}, Sentiment: {$message->sentiment}\n";
    }
    echo "\n";
}

// 5. Verificar tickets
echo "5️⃣ Verificando tickets creados\n";
echo str_repeat("-", 30) . "\n";

$tickets = App\Models\Ticket::with('client')->get();
foreach ($tickets as $ticket) {
    echo "Ticket #{$ticket->id}\n";
    echo "  Cliente: {$ticket->client->name}\n";
    echo "  Asunto: {$ticket->subject}\n";
    echo "  Estado: {$ticket->status}\n";
    echo "  Prioridad: {$ticket->priority}\n\n";
}

echo str_repeat("=", 50) . "\n";
echo "✅ Pruebas completadas\n";
