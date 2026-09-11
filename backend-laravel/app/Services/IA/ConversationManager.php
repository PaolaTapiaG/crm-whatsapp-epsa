<?php

namespace App\Services\IA;

use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Meter;
use Illuminate\Support\Facades\Log;

class ConversationManager
{
    protected $ollamaService;
    protected $memoryManager;
    protected $useIA;

    public function __construct(OllamaService $ollamaService)
    {
        $this->ollamaService = $ollamaService;
        $this->memoryManager = new MemoryManager();
        $this->useIA = filter_var(env('IA_ENABLED', false), FILTER_VALIDATE_BOOL);
    }

    /**
     * Procesar mensaje y generar respuesta
     */
    public function processMessage(Client $client, Conversation $conversation, string $text)
    {
        $context = $conversation->context ?? [];
        $normalizedText = $this->normalizeText($text);
        $this->memoryManager->rememberLocalFacts($conversation, $text);
        $context = $conversation->fresh()->context ?? [];

        $memory = $this->memoryManager->get($conversation);
        if (!empty($memory['nombre'])) {
            $client->update(['name' => mb_convert_case($memory['nombre'], MB_CASE_TITLE, 'UTF-8')]);
            $client->refresh();
        }

        // Los saludos siempre reinician el flujo y muestran el menú.
        if ($this->isGreeting($normalizedText)) {
            $conversation->update(['context' => array_merge($context, [
                'waiting_for' => null,
                'action' => null,
                'menu_shown' => true,
            ])]);
            $analysis = ['intent' => 'saludo', 'sentiment' => 'positivo', 'confidence' => 100];
        } elseif (($context['waiting_for'] ?? null) === 'nombre') {
            $result = $this->processNombreInput($client, $conversation, $text);
            return ['response' => $result, 'analysis' => ['intent' => 'nombre', 'confidence' => 100]];
        } elseif ($this->isMenuOption($normalizedText)) {
            $analysis = $this->detectIntent($normalizedText);
        } elseif (($context['waiting_for'] ?? null) === 'socio_nombre') {
            $result = $this->processSocioNameInput($client, $conversation, $text);
            return ['response' => $result, 'analysis' => ['intent' => 'socio_nombre', 'confidence' => 100]];
        } elseif (($context['waiting_for'] ?? null) === 'medidor') {
            $result = $this->processMedidorInput($client, $conversation, $text);
            return ['response' => $result, 'analysis' => ['intent' => 'medidor', 'confidence' => 100]];
        } elseif (($context['waiting_for'] ?? null) === 'metodo_pago') {
            $result = $this->processMetodoPagoInput($conversation, $normalizedText);
            return ['response' => $result, 'analysis' => ['intent' => 'metodo_pago', 'confidence' => 100]];
        } elseif (($context['waiting_for'] ?? null) === 'problema_tipo') {
            $result = $this->processProblemaInput($client, $conversation, $normalizedText);
            return ['response' => $result, 'analysis' => ['intent' => 'problema_servicio', 'confidence' => 100]];
        } elseif (($context['waiting_for'] ?? null) === 'zona') {
            $result = $this->processZonaInput($conversation, $text);
            return ['response' => $result, 'analysis' => ['intent' => 'zona', 'confidence' => 100]];
        } else {
            $ruleAnalysis = $this->detectIntent($normalizedText);
            $analysis = $this->useIA
                ? $this->analyzeWithOllama($text, $conversation)
                : $ruleAnalysis;

            // Preserve Groq as the main classifier, but never let a vague result
            // override an explicit service problem in the user's own words.
            if (($ruleAnalysis['confidence'] ?? 0) >= 90
                && ($ruleAnalysis['intent'] ?? 'otro') !== 'otro'
                && in_array($ruleAnalysis['intent'], ['rotura_caneria', 'fuga_casa', 'falta_agua'], true)) {
                $analysis = array_merge($analysis, $ruleAnalysis, ['source' => 'groq_with_safety_rule']);
            }
        }

        if (!empty($analysis['entities']) && is_array($analysis['entities'])) {
            $this->memoryManager->remember($conversation, $analysis['entities']);
        }

        if ($this->useIA && in_array($analysis['intent'] ?? null, ['rotura_caneria', 'fuga_casa', 'falta_agua'], true)) {
            $analysis['emotion'] = $this->ollamaService->analyzeEmotion($text);
        }

        $response = $this->generateResponseByIntent($client, $conversation, $text, $analysis);
        
        return [
            'response' => $response,
            'analysis' => $analysis
        ];
    }

    /**
     * Obtener historial de conversación
     */
    private function getConversationHistory(Conversation $conversation)
    {
        return $conversation->messages()
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->reverse()
            ->map(function ($message) {
                return [
                    'role' => $message->sender === 'user' ? 'usuario' : 'asistente',
                    'content' => $message->text
                ];
            })
            ->toArray();
    }

    /**
     * Generar respuesta según intención
     */
    private function generateResponseByIntent(Client $client, Conversation $conversation, string $text, array $analysis)
    {
        $intent = $analysis['intent'] ?? 'otro';
        $conversationContext = $conversation->context ?? [];
        
        // Verificar estado de la conversación
        if (isset($conversationContext['waiting_for']) && $conversationContext['waiting_for'] === 'medidor') {
            return $this->processMedidorInput($client, $conversation, $text);
        }

        switch ($intent) {
            case 'saludo':
                return $this->handleSaludo($client);
                
            case 'consultar_saldo':
                return $this->handleConsultarSaldo($client, $conversation);
                
            case 'pagar_deuda':
                return $this->handlePagarDeuda($conversation);
                
            case 'horarios':
                return $this->handleHorarios();
                
            case 'problemas_servicio':
                return $this->handleProblemasServicio($conversation);
                
            case 'rotura_caneria':
                return $this->handleRoturaCaneria($client, $conversation, $text);
                
            case 'fuga_casa':
                return $this->handleFugaCasa($client, $conversation, $text);
                
            case 'falta_agua':
                return $this->handleFaltaAgua($client, $conversation);

            case 'fecha_hora':
                return $this->handleFechaHora();

            case 'otro':
            case 'consulta_general':
                return $analysis['response'] ?? $this->handleDefault();
                
            case 'hablar_operador':
                return $this->handleHablarOperador($conversation);
                
            case 'despedida':
                return $this->handleDespedida();
                
            default:
                return $this->handleDefault();
        }
    }

    private function normalizeText(string $text): string
    {
        return strtolower(trim(strtr($text, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n',
        ])));
    }

    private function isGreeting(string $text): bool
    {
        return (bool) preg_match('/^(hola|buenas(?: dias| tardes| noches)?|hey|que tal)\b/', $text);
    }

    private function processNombreInput(Client $client, Conversation $conversation, string $text): string
    {
        $name = trim(preg_replace('/[^\p{L}\s\'-]/u', '', $text));

        if (mb_strlen($name) < 2) {
            return 'Por favor, indícame tu nombre para brindarte una atención personalizada.';
        }

        $client->update(['name' => $name]);
        $conversation->update(['context' => array_merge($conversation->context ?? [], [
            'waiting_for' => null,
            'menu_shown' => true,
        ])]);

        return $this->handleSaludo($client);
    }

    private function isMenuOption(string $text): bool
    {
        return (bool) preg_match('/^(?:opcion\s*)?([1-5]|[a-e])$/', $text);
    }

    private function analyzeWithOllama(string $text, Conversation $conversation): array
    {
        $history = $this->getConversationHistory($conversation);
        $analysis = $this->ollamaService->analyzeMessage($text, $history);

        if (!is_array($analysis) || empty($analysis['intent'])) {
            Log::warning('Ollama no devolvio una intencion valida; usando reglas', ['text' => $text]);
            return $this->detectIntent($this->normalizeText($text));
        }

        $validIntents = [
            'saludo', 'consultar_saldo', 'pagar_deuda', 'horarios',
            'problemas_servicio', 'rotura_caneria', 'fuga_casa',
            'falta_agua', 'fecha_hora', 'hablar_operador', 'despedida',
            'consulta_general', 'otro',
        ];

        if (!in_array($analysis['intent'], $validIntents, true)) {
            return $this->detectIntent($this->normalizeText($text));
        }

        // Ollama puede responder "otro" aunque el texto contenga una intención clara.
        // Conservamos la IA como primera opción y evitamos perder acciones conocidas.
        $ruleAnalysis = $this->detectIntent($this->normalizeText($text));
        if ($analysis['intent'] === 'otro'
            && ($ruleAnalysis['intent'] ?? 'otro') !== 'otro') {
            $ruleAnalysis['source'] = 'ollama_fallback_rules';
            return $ruleAnalysis;
        }

        $analysis['confidence'] = max(0, min(100, (int) ($analysis['confidence'] ?? 70)));
        $analysis['source'] = 'ollama';

        Log::info('Intencion analizada por Ollama', [
            'intent' => $analysis['intent'],
            'confidence' => $analysis['confidence'],
        ]);

        return $analysis;
    }

    private function detectIntent(string $text): array
    {
        if (preg_match('/^(?:opcion\s*)?([1-5]|[a-e])$/', $text, $matches)) {
            return [
                'intent' => [
                    '1' => 'consultar_saldo',
                    '2' => 'pagar_deuda',
                    '3' => 'horarios',
                    '4' => 'problemas_servicio',
                    '5' => 'hablar_operador',
                    'a' => 'consultar_saldo',
                    'b' => 'pagar_deuda',
                    'c' => 'horarios',
                    'd' => 'problemas_servicio',
                    'e' => 'hablar_operador',
                ][$matches[1]],
                'sentiment' => 'neutral',
                'confidence' => 100,
            ];
        }

        $keywords = [
            'pagar_deuda' => ['pagar', 'pago', 'qr', 'transferencia'],
            'consultar_saldo' => ['saldo', 'debo', 'deuda', 'factura', 'medidor'],
            'horarios' => ['horario', 'atencion', 'oficina', 'abren', 'cierran'],
            'problemas_servicio' => ['problema', 'servicio'],
            'rotura_caneria' => ['rotura', 'caneria'],
            'fuga_casa' => ['fuga', 'goteo', 'filtracion'],
            'falta_agua' => ['no tengo agua', 'sin agua', 'corte', 'suministro'],
            'fecha_hora' => ['que dia es', 'que fecha es', 'fecha de hoy', 'hora actual'],
            'hablar_operador' => ['operador', 'humano', 'persona', 'asesor'],
            'despedida' => ['adios', 'chau', 'hasta luego', 'gracias', 'bye'],
        ];

        foreach ($keywords as $intent => $intentKeywords) {
            foreach ($intentKeywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    return ['intent' => $intent, 'sentiment' => 'neutral', 'confidence' => 90];
                }
            }
        }

        return ['intent' => 'otro', 'sentiment' => 'neutral', 'confidence' => 50];
    }

    /**
     * Manejar saludo
     */
    private function handleSaludo(Client $client)
    {
        $greeting = '¡Hola! 👋';
        if ($client->name) {
            $nombre = explode(' ', trim($client->name))[0];
            $tratamiento = $this->getTratamiento($client->name);
            $greeting = "¡Hola {$tratamiento} {$nombre}! 👋";
        }

        $response = $greeting . " Bienvenido al servicio de agua.\n\n";
        $response .= "¿En qué podemos ayudarte hoy?\n\n";
        $response .= "*MENÚ PRINCIPAL*\n";
        $response .= "A. Consultar saldo 💧\n";
        $response .= "B. Pagar mi deuda 💳\n";
        $response .= "C. Horarios de atención 🕐\n";
        $response .= "D. Problemas con mi servicio de agua 🔧\n";
        $response .= "E. Hablar con un operador 👤\n\n";
        $response .= "Responde con la *letra* o *número* de la opción.";
        
        return $response;
    }

    private function getTratamiento(string $name): string
    {
        $firstName = strtolower(explode(' ', trim($name))[0]);
        $femaleNames = ['ana', 'beatriz', 'carmen', 'diana', 'elena', 'gabriela', 'isabel', 'laura', 'maria', 'paola', 'rosa', 'sofia'];

        return in_array($firstName, $femaleNames, true) || str_ends_with($firstName, 'a') ? 'señora' : 'señor';
    }

    /**
     * Manejar consulta de saldo
     */
    private function handleConsultarSaldo(Client $client, Conversation $conversation)
    {
        $conversation->update(['context' => array_merge($conversation->context ?? [], [
            'waiting_for' => 'socio_nombre',
            'action' => 'consulta_saldo',
        ])]);

        return "Para consultar el saldo, por favor escribe el *nombre completo del socio registrado*.";
    }

    private function processSocioNameInput(Client $client, Conversation $conversation, string $text): string
    {
        $name = trim(preg_replace('/[^\p{L}\s\'-]/u', '', $text));

        if (mb_strlen($name) < 3) {
            return 'Por favor escribe el nombre completo del socio registrado.';
        }

        $conversation->update(['context' => array_merge($conversation->context ?? [], [
            'waiting_for' => null,
            'socio_nombre' => $name,
        ])]);

        $this->transferToOperator($conversation, 'consulta_saldo');

        return "✅ Recibimos la consulta de saldo para el socio *{$name}*.\n\n" .
            "Un operador verificara el registro y te informara el monto pendiente en este chat.";
    }

    /**
     * Procesar input de número de medidor
     */
    private function processMedidorInput(Client $client, Conversation $conversation, string $text)
    {
        // Extraer número (6-8 dígitos)
        if (preg_match('/\d{6,8}/', $text, $matches)) {
            $medidor = $matches[0];
            
            // Actualizar contexto
            $context = $conversation->context ?? [];
            unset($context['waiting_for']);
            $context['medidor'] = $medidor;
            $conversation->update(['context' => $context]);
            
            $saldo = $this->getOutstandingBalance($client, $medidor);

            if ($saldo === null) {
                return "❌ No encontré un medidor registrado con el número *{$medidor}*.\n\n" .
                    "Verifica el número o solicita ayuda a un operador.";
            }
            
            $response = "✅ *INFORMACIÓN DE SALDO*\n\n";
            $response .= "📊 Número de medidor: *{$medidor}*\n";
            $response .= "💰 Saldo pendiente: *Bs {$saldo}*\n";
            $response .= "📅 Último pago: 15/08/2026\n\n";
            $response .= "¿Deseas realizar el pago ahora?\n";
            $response .= "1️⃣ Sí, pagar ahora\n";
            $response .= "2️⃣ No, volver al menú principal\n";
            
            return $response;
        }
        
        $response = "❌ No pude identificar el número de medidor o CI.\n\n";
        $response .= "Por favor, envíame un número válido (6-8 dígitos).";
        
        return $response;
    }

    /**
     * Manejar pago de deuda
     */
    private function handlePagarDeuda(Conversation $conversation)
    {
        $this->transferToOperator($conversation, 'pago');

        return "✅ Tu solicitud de pago fue enviada a un operador.\n\n" .
            "El operador te informará cuánto debes y te enviará el número de cuenta o el código QR correspondiente.\n" .
            "Por favor, espera un momento.";
    }

    /**
     * Manejar horarios
     */
    private function handleHorarios()
    {
        $now = now();
        $dayOfWeek = $now->dayOfWeek;
        $currentHour = (int)$now->format('H');
        $isBusinessHours = ($dayOfWeek >= 1 && $dayOfWeek <= 5 && $currentHour >= 14 && $currentHour < 18)
            || ($dayOfWeek === 6 && $currentHour >= 8 && $currentHour < 12);
        
        $response = "🕐 *HORARIOS DE ATENCIÓN*\n\n";
        $response .= "📅 Lunes a Viernes: 14:00 - 18:00\n";
        $response .= "📅 Sábados: 08:00 - 12:00\n";
        $response .= "📅 Domingos y feriados: *CERRADO*\n\n";
        
        if (!$isBusinessHours) {
            $response .= "⚠️ *AVISO:* En este momento nuestras oficinas están *CERRADAS*.\n\n";
            $response .= "Sin embargo, puedes:\n";
            $response .= "1️⃣ Consultar tu saldo en línea\n";
            $response .= "2️⃣ Pagar mediante QR (disponible 24/7)\n";
            $response .= "3️⃣ Reportar emergencias\n\n";
            $response .= "¿Qué deseas hacer?";
        } else {
            $response .= "✅ Estamos *ABIERTOS* en este momento.\n\n";
            $response .= "¿Necesitas direcciones de nuestras oficinas?";
        }
        
        return $response;
    }

    /**
     * Manejar problemas de servicio
     */
    private function handleProblemasServicio(Conversation $conversation)
    {
        $conversation->update(['context' => array_merge($conversation->context ?? [], [
            'waiting_for' => 'problema_tipo',
            'action' => 'problemas_servicio',
        ])]);

        $response = "🔧 *PROBLEMAS CON EL SERVICIO*\n\n";
        $response .= "Selecciona el tipo de problema:\n\n";
        $response .= "1️⃣ Rotura de cañería en mi zona\n";
        $response .= "2️⃣ Fuga de agua en mi casa\n";
        $response .= "3️⃣ No tengo agua\n\n";
        $response .= "Responde con el *número* de tu problema.";
        
        return $response;
    }

    private function processMetodoPagoInput(Conversation $conversation, string $text): string
    {
        if ($text === '1' || str_contains($text, 'qr')) {
            $response = "✅ *QR SIMPLE*\n\n";
            $response .= "📱 Escanea este código QR para realizar tu pago:\n\n[QR CODE]\n\n";
            $response .= "💳 Monto: Bs 87.50\n📅 Válido por 24 horas";
        } elseif ($text === '2' || str_contains($text, 'transferencia')) {
            $response = "✅ *TRANSFERENCIA BANCARIA*\n\n";
            $response .= "🏦 Banco: Banco Unión\n📋 Cuenta: 123456789\n📝 Titular: Empresa de Agua\n\n";
            $response .= "Envía el comprobante para confirmar tu pago.";
        } elseif ($text === '3' || str_contains($text, 'oficina')) {
            $response = "✅ *PAGO EN OFICINA*\n\n";
            $response .= "🏢 Puedes pagar en cualquiera de nuestras oficinas.\n\n";
            $response .= "Horario: L-V 8:00-18:00, Sáb 9:00-13:00";
        } else {
            return "Por favor, selecciona una opción válida (1, 2 o 3).";
        }

        $conversation->update(['context' => array_merge($conversation->context ?? [], [
            'waiting_for' => null,
            'action' => null,
        ])]);

        return $response;
    }

    private function processProblemaInput(Client $client, Conversation $conversation, string $text): string
    {
        if ($text === '1' || str_contains($text, 'rotura')) {
            return $this->handleRoturaCaneria($client, $conversation, $text);
        }

        if ($text === '2' || str_contains($text, 'fuga')) {
            return $this->handleFugaCasa($client, $conversation, $text);
        }

        if ($text === '3' || str_contains($text, 'no tengo') || str_contains($text, 'sin agua')) {
            return $this->handleFaltaAgua($client, $conversation);
        }

        return "Por favor, selecciona una opción válida (1, 2 o 3).";
    }

    /**
     * Manejar rotura de cañería
     */
    private function handleRoturaCaneria(Client $client, Conversation $conversation, string $text)
    {
        // Crear ticket
        $ticket = $conversation->tickets()->create([
            'client_id' => $client->id,
            'subject' => 'Rotura de cañería en zona',
            'description' => $text,
            'category' => 'rotura_caneria',
            'priority' => 'urgent',
            'status' => 'open',
        ]);
        
        $response = "🚨 *REPORTE DE ROTURA REGISTRADO*\n\n";
        $response .= "✅ Ticket #{$ticket->id} creado exitosamente\n";
        $response .= "🔴 Prioridad: *URGENTE*\n\n";
        $response .= "Un equipo técnico será enviado a tu zona.\n";
        $response .= "⏰ Tiempo estimado: 2-4 horas\n\n";
        $response .= "¿Necesitas algo más?";
        
        return $response;
    }

    /**
     * Manejar fuga en casa
     */
    private function handleFugaCasa(Client $client, Conversation $conversation, string $text)
    {
        // Crear ticket
        $ticket = $conversation->tickets()->create([
            'client_id' => $client->id,
            'subject' => 'Fuga de agua en domicilio',
            'description' => $text,
            'category' => 'fuga_casa',
            'priority' => 'high',
            'status' => 'open',
        ]);
        
        $response = "🏠 *REPORTE DE FUGA REGISTRADO*\n\n";
        $response .= "✅ Ticket #{$ticket->id} creado exitosamente\n";
        $response .= "🟠 Prioridad: *ALTA*\n\n";
        $response .= "💡 *CONSEJO:* Cierra la llave de paso principal para evitar mayores daños.\n\n";
        $response .= "Un técnico te contactará para coordinar la visita.\n";
        $response .= "¿Necesitas asistencia inmediata?";
        
        return $response;
    }

    /**
     * Manejar falta de agua
     */
    private function handleFaltaAgua(Client $client, Conversation $conversation)
    {
        $conversation->update(['context' => array_merge($conversation->context ?? [], [
            'waiting_for' => 'zona',
            'action' => 'falta_agua',
        ])]);

        $response = "💧 *REPORTE DE FALTA DE AGUA*\n\n";
        $response .= "Lamento los inconvenientes.\n\n";
        $response .= "Para verificar si hay cortes programados en tu zona,\n";
        $response .= "necesito tu *dirección* o *zona*.\n\n";
        $response .= "📝 Por favor, indícame tu zona (Norte, Sur, Este, Oeste, Centro).";
        
        return $response;
    }

    private function processZonaInput(Conversation $conversation, string $text): string
    {
        $zona = trim($text);
        $conversation->update(['context' => array_merge($conversation->context ?? [], [
            'waiting_for' => null,
            'zona' => $zona,
        ])]);

        return "💧 Gracias. Verificaré los cortes reportados para la zona *{$zona}*.\n\n" .
            "Por el momento no hay una consulta en línea disponible; un agente puede confirmar el estado de tu zona.\n\n" .
            "¿Necesitas reportar una emergencia o hablar con un operador?";
    }

    private function handleFechaHora(): string
    {
        return 'Hoy es ' . now()->locale('es')->isoFormat('dddd D [de] MMMM [de] YYYY') .
            ' y son las ' . now()->format('H:i') . ' (hora local).';
    }

    private function transferToOperator(Conversation $conversation, string $reason): void
    {
        $conversation->update([
            'status' => 'transferred',
            'priority' => 'high',
            'context' => array_merge($conversation->context ?? [], [
                'waiting_for' => null,
                'operator_reason' => $reason,
            ]),
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender' => 'system',
            'text' => 'Conversación enviada a operador: ' . $reason,
            'metadata' => ['type' => 'transfer', 'reason' => $reason],
        ]);
    }

    /**
     * Manejar hablar con operador
     */
    private function handleHablarOperador(Conversation $conversation)
    {
        // Transferir conversación
        $conversation->update([
            'status' => 'transferred',
            'priority' => 'high'
        ]);
        
        Message::create([
            'conversation_id' => $conversation->id,
            'sender' => 'system',
            'text' => 'Conversación transferida a operador humano',
            'metadata' => ['type' => 'transfer']
        ]);
        
        $response = "👤 *TRANSFERENCIA A OPERADOR*\n\n";
        $response .= "Te conectaré con un operador humano.\n";
        $response .= "⏰ Tiempo estimado de espera: 5 minutos\n\n";
        $response .= "Por favor, mantente en línea...";
        
        return $response;
    }

    /**
     * Manejar despedida
     */
    private function handleDespedida()
    {
        $response = "¡Gracias por contactarnos! 😊\n\n";
        $response .= "¿Hay algo más en lo que pueda ayudarte?";
        
        return $response;
    }

    /**
     * Manejar entrada desconocida
     */
    private function handleDefault()
    {
        return "Puedo ayudarte con tu saldo, pagos, horarios, reportes del servicio o con un operador.\n\n" .
            "Escribe *menú* para ver las opciones disponibles.";
    }

    /**
     * Obtener saldo simulado
     */
    private function getOutstandingBalance(Client $client, string $medidor): ?string
    {
        $meter = Meter::where('meter_number', $medidor)
            ->where('client_id', $client->id)
            ->with(['bills' => fn ($query) => $query->whereIn('status', ['pending', 'overdue'])])
            ->first();

        if (!$meter) {
            return null;
        }

        return number_format((float) $meter->bills->sum('amount'), 2);
    }
}
