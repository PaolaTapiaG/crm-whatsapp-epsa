<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\IA\ConversationManager;
use App\Services\IA\OllamaService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class WhatsAppService
{
    protected $conversationManager;
    protected $ollamaService;

    public function __construct()
    {
        $this->ollamaService = new OllamaService();
        $this->conversationManager = new ConversationManager($this->ollamaService);
    }

    /**
     * Procesar mensaje entrante
     */
    public function processIncomingMessage(array $data)
    {
        try {
            Log::channel('whatsapp')->info('Procesando mensaje con IA', [
                'from' => $data['from'] ?? 'unknown',
                'text' => $data['text'] ?? ''
            ]);

            // 1. Buscar o crear cliente
            $client = $this->findOrCreateClient($data);

            // 2. Buscar o crear conversación
            $conversation = $this->findOrCreateConversation($client, $data);

            if (!empty($data['message_id'])) {
                $alreadyProcessed = Message::where('whatsapp_message_id', $data['message_id'])->exists();
                if ($alreadyProcessed) {
                    Log::channel('whatsapp')->info('Mensaje duplicado ignorado', [
                        'message_id' => $data['message_id'],
                        'from' => $data['from'] ?? null,
                    ]);

                    return [
                        'success' => true,
                        'duplicate' => true,
                        'conversation_id' => $conversation->id,
                        'response' => '',
                        'session_id' => $conversation->session_id,
                        'analysis' => ['intent' => 'duplicado', 'confidence' => 100],
                    ];
                }
            }

            // 3. Guardar mensaje del usuario
            $userMessage = $this->saveUserMessage($conversation, $data);

            $normalizedText = $this->normalizeText($data['text'] ?? '');
            $isMenuOption = (bool) preg_match('/^(?:opcion\s*)?[1-5a-e]$/', $normalizedText);

            if ($conversation->status === 'transferred'
                && (($conversation->context ?? [])['waiting_for'] ?? null) === null
                && !$isMenuOption) {
                $client->update(['last_interaction_at' => now()]);

                return [
                    'success' => true,
                    'conversation_id' => $conversation->id,
                    'message_id' => $userMessage->id,
                    'response' => '',
                    'session_id' => $conversation->session_id,
                    'analysis' => ['intent' => 'operador', 'confidence' => 100],
                ];
            }

            $nameChange = $this->handleNameChangeCommand($client, $conversation, $data['text'] ?? '');
            if ($nameChange) {
                $botMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender' => 'bot',
                    'text' => $nameChange,
                    'intent' => 'actualizar_nombre',
                    'sentiment' => 0,
                    'confidence' => 1,
                    'metadata' => ['onboarding' => true],
                ]);

                $client->update(['last_interaction_at' => now()]);

                return [
                    'success' => true,
                    'conversation_id' => $conversation->id,
                    'message_id' => $botMessage->id,
                    'response' => $nameChange,
                    'session_id' => $conversation->session_id,
                    'analysis' => ['intent' => 'actualizar_nombre', 'confidence' => 100, 'sentiment' => 'neutral'],
                ];
            }

            $onboarding = $isMenuOption ? null : $this->handleNameBeforeMenu($client, $conversation, $data['text'] ?? '');
            if ($onboarding) {
                $botMessage = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender' => 'bot',
                    'text' => $onboarding,
                    'intent' => 'registro_nombre',
                    'sentiment' => 0,
                    'confidence' => 1,
                    'metadata' => ['onboarding' => true],
                ]);

                $client->update(['last_interaction_at' => now()]);

                return [
                    'success' => true,
                    'conversation_id' => $conversation->id,
                    'message_id' => $botMessage->id,
                    'response' => $onboarding,
                    'session_id' => $conversation->session_id,
                    'analysis' => [
                        'intent' => 'registro_nombre',
                        'confidence' => 100,
                        'sentiment' => 'neutral',
                        'requires_action' => 'ask_name',
                    ],
                ];
            }

            // 4. Procesar con ConversationManager (IA)
            $result = $this->conversationManager->processMessage(
                $client,
                $conversation,
                $data['text'] ?? ''
            );

            // 5. Guardar respuesta del bot
            $botMessage = Message::create([
                'conversation_id' => $conversation->id,
                'sender' => 'bot',
                'text' => $result['response'],
                'intent' => $result['analysis']['intent'] ?? 'otro',
                'sentiment' => isset($result['analysis']['sentiment']) ? 
                    ($result['analysis']['sentiment'] === 'positivo' ? 0.7 : 
                     ($result['analysis']['sentiment'] === 'negativo' ? -0.7 : 0)) : 0,
                'confidence' => ($result['analysis']['confidence'] ?? 50) / 100,
                'metadata' => [
                    'analysis' => $result['analysis'],
                    'ia_processed' => true
                ]
            ]);

            // 6. Actualizar última interacción
            $client->update(['last_interaction_at' => now()]);

            Log::channel('whatsapp')->info('Respuesta IA generada', [
                'intent' => $result['analysis']['intent'] ?? 'otro',
                'confidence' => $result['analysis']['confidence'] ?? 0
            ]);

            return [
                'success' => true,
                'conversation_id' => $conversation->id,
                'message_id' => $botMessage->id,
                'response' => $result['response'],
                'session_id' => $conversation->session_id,
                'analysis' => $result['analysis']
            ];

        } catch (\Exception $e) {
            Log::channel('whatsapp')->error('Error procesando mensaje', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return [
                'success' => false,
                'response' => 'Lo siento, estoy teniendo problemas técnicos. Por favor, intenta nuevamente.',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Buscar o crear cliente
     */
    private function findOrCreateClient(array $data)
    {
        $whatsappNumber = $data['from'] ?? null;
        
        if (!$whatsappNumber) {
            throw new \Exception('Número de WhatsApp no proporcionado');
        }

        return Client::firstOrCreate(
            ['whatsapp_number' => $whatsappNumber],
            [
                'name' => $data['name'] ?? null,
                'language' => 'es',
                'status' => 'active',
                'metadata' => [
                    'first_contact' => now(),
                    'source' => 'whatsapp'
                ]
            ]
        );
    }

    /**
     * Buscar o crear conversación
     */
    private function findOrCreateConversation(Client $client, array $data)
    {
        $sessionId = $data['session_id'] ?? ('wa-' . $client->whatsapp_number);

        $conversation = Conversation::where('client_id', $client->id)
            ->where('channel', 'whatsapp')
            ->whereIn('status', ['active', 'pending', 'transferred'])
            ->first();

        if (!$conversation) {
            $conversation = Conversation::where('client_id', $client->id)
                ->where('session_id', 'wa-' . $client->whatsapp_number)
                ->latest()
                ->first();
        }

        if (!$conversation) {
            $conversation = Conversation::create([
                'client_id' => $client->id,
                'session_id' => $sessionId,
                'status' => 'active',
                'channel' => 'whatsapp',
                'priority' => 'normal',
                'context' => [
                    'waiting_for' => null,
                    'action' => null,
                    'menu_shown' => false
                ],
                'started_at' => now()
            ]);
        } elseif ($conversation->status === 'closed') {
            $conversation->update(['status' => 'active', 'ended_at' => null]);
        } elseif ($conversation->session_id !== 'wa-' . $client->whatsapp_number) {
            $sessionExists = Conversation::where('session_id', 'wa-' . $client->whatsapp_number)
                ->whereKeyNot($conversation->id)
                ->exists();

            if (!$sessionExists) {
                $conversation->update(['session_id' => 'wa-' . $client->whatsapp_number]);
            }
        }

        return $conversation;
    }

    /**
     * Guardar mensaje del usuario
     */
    private function saveUserMessage(Conversation $conversation, array $data)
    {
        return Message::create([
            'conversation_id' => $conversation->id,
            'whatsapp_message_id' => $data['message_id'] ?? null,
            'sender' => 'user',
            'text' => $data['text'] ?? '',
            'metadata' => [
                'message_type' => $data['message_type'] ?? 'text'
            ]
        ]);
    }

    private function handleNameBeforeMenu(Client $client, Conversation $conversation, string $text): ?string
    {
        $context = $conversation->context ?? [];
        $metadata = $client->metadata ?? [];

        if (($metadata['name_confirmed'] ?? false) === true) {
            return null;
        }

        if (($context['waiting_for'] ?? null) === 'name') {
            $name = $this->cleanPersonName($text);
            if (mb_strlen($name) < 3) {
                return 'Por favor indiqueme su nombre completo para continuar.';
            }

            $client->update([
                'name' => $name,
                'metadata' => array_merge($metadata, ['name_confirmed' => true]),
            ]);

            $conversation->update([
                'context' => array_merge($context, [
                    'waiting_for' => null,
                    'menu_shown' => true,
                ]),
            ]);

            return "Gracias {$name}. Bienvenido al servicio de agua EPSA El Portillo.\n\nMenu de atencion:\n1. Consultar saldo\n2. Pagar deuda por QR\n3. Reportar fuga o falta de agua\n4. Horarios y ubicacion\n5. Hablar con operador";
        }

        if (blank($client->name)) {
            $conversation->update([
                'context' => array_merge($context, [
                    'waiting_for' => 'name',
                    'menu_shown' => false,
                ]),
            ]);

            return 'Antes de enviarte el menu de atencion, por favor escribe tu nombre completo.';
        }

        $conversation->update([
            'context' => array_merge($context, [
                'waiting_for' => 'name',
                'menu_shown' => false,
            ]),
        ]);

        return "Tenemos registrado el nombre \"{$client->name}\". Si es correcto, escribelo otra vez para confirmarlo. Si esta mal, escribe tu nombre completo correcto.";
    }

    private function handleNameChangeCommand(Client $client, Conversation $conversation, string $text): ?string
    {
        $normalized = $this->normalizeText($text);

        if (preg_match('/(?:mi nombre es|me llamo|soy)\s+(.+)/iu', $text, $matches)) {
            $name = $this->cleanPersonName($matches[1]);
            if (mb_strlen($name) >= 3) {
                $metadata = $client->metadata ?? [];
                $client->update([
                    'name' => $name,
                    'metadata' => array_merge($metadata, ['name_confirmed' => true]),
                ]);
                $conversation->update(['context' => array_merge($conversation->context ?? [], ['waiting_for' => null])]);

                return "Listo, actualice tu nombre a {$name}.";
            }
        }

        if (str_contains($normalized, 'cambiar nombre') || str_contains($normalized, 'nombre incorrecto') || str_contains($normalized, 'me equivoque')) {
            $metadata = $client->metadata ?? [];
            $metadata['name_confirmed'] = false;
            $client->update(['metadata' => $metadata]);
            $conversation->update(['context' => array_merge($conversation->context ?? [], ['waiting_for' => 'name'])]);

            return 'Claro. Escribe tu nombre completo correcto y lo actualizare antes de continuar.';
        }

        return null;
    }

    private function cleanPersonName(string $text): string
    {
        return trim(preg_replace('/\s+/', ' ', preg_replace('/[^\p{L}\s\'-]/u', '', $text)));
    }

    private function normalizeText(string $text): string
    {
        $text = trim($text);
        $text = str_replace(['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'], ['1', '2', '3', '4', '5'], $text);
        return strtolower(trim(strtr($text, [
            'á' => 'a', 'Á' => 'a',
            'é' => 'e', 'É' => 'e',
            'í' => 'i', 'Í' => 'i',
            'ó' => 'o', 'Ó' => 'o',
            'ú' => 'u', 'Ú' => 'u',
            'ñ' => 'n', 'Ñ' => 'n',
        ])));
    }

    public function sendWhatsAppMessage(string $to, string $text): array
    {
        $phoneNumberId = config('whatsapp.phone_number_id');
        $accessToken = config('whatsapp.access_token');

        if (!$phoneNumberId || !$accessToken) {
            throw new \RuntimeException('WhatsApp Cloud API no está configurada: falta PHONE_NUMBER_ID o ACCESS_TOKEN.');
        }

        $response = Http::withToken($accessToken)
            ->acceptJson()
            ->post(rtrim(config('whatsapp.api_url'), '/') . "/{$phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => preg_replace('/[^0-9]/', '', $to),
                'type' => 'text',
                'text' => ['body' => $text],
            ]);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('WhatsApp Cloud API rechazó el mensaje', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            throw new \RuntimeException('WhatsApp Cloud API: ' . ($response->json('error.message') ?? 'error desconocido'));
        }

        return $response->json();
    }
}
