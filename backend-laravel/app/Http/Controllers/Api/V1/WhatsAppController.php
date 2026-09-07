<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppAPIService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppController extends Controller
{
    protected $whatsAppService;
    protected $whatsAppAPIService;

    public function __construct(WhatsAppService $whatsAppService, WhatsAppAPIService $whatsAppAPIService)
    {
        $this->whatsAppService = $whatsAppService;
        $this->whatsAppAPIService = $whatsAppAPIService;
    }

    /**
     * Verificar webhook (GET)
     */
    public function verifyWebhook(Request $request)
    {
        $mode = $request->query('hub.mode', $request->query('hub_mode'));
        $token = trim((string) $request->query('hub.verify_token', $request->query('hub_verify_token')));
        $challenge = $request->query('hub.challenge', $request->query('hub_challenge'));

        Log::info('Webhook verification', [
            'mode' => $mode,
            'token' => $token,
            'challenge' => $challenge,
        ]);

        if ($mode === 'subscribe' && hash_equals(trim((string) config('whatsapp.verify_token')), $token) && filled($challenge)) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response('Unauthorized', 403);
    }

    /**
     * Recibir mensajes de WhatsApp (POST)
     * ESTE MÉTODO PROCESA Y RESPONDE AUTOMÁTICAMENTE
     */
    public function webhook(Request $request)
    {
        try {
            $payload = $request->all();
            $directTest = isset($payload['from'], $payload['text']);
            $results = [];
            
            Log::info('📥 Webhook recibido', [
                'payload' => json_encode($payload)
            ]);

            // Extraer mensajes
            $messages = $this->extractMessages($payload);

            if (empty($messages)) {
                $value = data_get($payload, 'entry.0.changes.0.value', []);
                Log::info('Webhook sin mensajes entrantes', [
                    'field' => data_get($payload, 'entry.0.changes.0.field'),
                    'has_statuses' => !empty($value['statuses']),
                    'statuses_count' => count($value['statuses'] ?? []),
                    'messages_count' => count($value['messages'] ?? []),
                ]);
                return response()->json(['success' => true]);
            }

            foreach ($messages as $message) {
                Log::info('📱 Procesando mensaje', [
                    'from' => $message['from'],
                    'text' => $message['text'],
                ]);

                // Marcar como leído
                if (!$directTest && isset($message['message_id'])) {
                    try {
                        $this->whatsAppAPIService->markAsRead($message['message_id']);
                    } catch (\Throwable $sendError) {
                        Log::warning('No se pudo marcar como leido; se continua el procesamiento', [
                            'message_id' => $message['message_id'],
                            'error' => $sendError->getMessage(),
                        ]);
                    }
                }

                // Procesar con IA
                $result = $this->whatsAppService->processIncomingMessage([
                    'from' => $message['from'],
                    'text' => $message['text'],
                    'name' => $message['name'],
                    'message_type' => $message['type'],
                    'message_id' => $message['message_id'],
                    'session_id' => 'wa-' . $message['from'],
                ]);

                if (!empty($message['media_id'])) {
                    $mediaUrl = $this->whatsAppAPIService->downloadIncomingMedia($message['media_id'], $message['media_extension'] ?? 'bin');
                    $conversation = \App\Models\Conversation::where('session_id', 'wa-' . $message['from'])->latest()->first();
                    if ($conversation) {
                        $stored = $conversation->messages()->where('sender', 'user')->latest()->first();
                        $metadata = $stored?->metadata ?? [];
                        $metadata['kind'] = 'payment_proof';
                        $metadata['media_url'] = $mediaUrl;
                        $stored?->update(['metadata' => $metadata, 'text' => $message['caption'] ?: 'Comprobante recibido']);
                    }
                    $result['response'] = 'Su pago esta en revision por el operador, espere unos minutos antes de recibir su factura.';
                }

                Log::info('🤖 Respuesta generada', [
                    'intent' => $result['analysis']['intent'] ?? 'desconocido',
                    'response' => $result['response'] ?? 'sin respuesta',
                ]);

                // Enviar respuesta automática
                if ($result['success'] && !empty($result['response'])) {
                    try {
                        $this->whatsAppAPIService->sendTextMessage(
                            $message['from'],
                            $result['response']
                        );
                        Log::info('✅ Respuesta de texto enviada');
                    } catch (\Throwable $sendError) {
                        Log::error('No se pudo enviar la respuesta por WhatsApp, pero el webhook queda confirmado', [
                            'from' => $message['from'],
                            'error' => $sendError->getMessage(),
                        ]);
                    }
                }

                $results[] = $result;
            }

            return response()->json([
                'success' => true,
                'data' => $directTest ? ($results[0] ?? null) : $results,
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error en webhook: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extraer mensajes del payload
     */
    private function extractMessages(array $payload)
    {
        $messages = [];

        try {
            if (isset($payload['from'], $payload['text'])) {
                return [[
                    'from' => $payload['from'],
                    'message_id' => $payload['message_id'] ?? null,
                    'text' => $payload['text'],
                    'type' => $payload['message_type'] ?? 'text',
                    'name' => $payload['name'] ?? null,
                    'media_id' => null,
                    'media_extension' => 'bin',
                    'caption' => '',
                ]];
            }

            if (!isset($payload['entry'])) {
                return $messages;
            }

            foreach ($payload['entry'] as $entry) {
                if (!isset($entry['changes'])) {
                    continue;
                }

                foreach ($entry['changes'] as $change) {
                    $value = $change['value'] ?? [];
                    
                    // Obtener mensajes
                    $messageList = $value['messages'] ?? [];
                    $contacts = $value['contacts'] ?? [];

                    foreach ($messageList as $message) {
                        $from = $message['from'] ?? null;
                        $messageId = $message['id'] ?? null;
                        $type = $message['type'] ?? 'text';
                        $text = '';

                        // Extraer texto según tipo
                        switch ($type) {
                            case 'text':
                                $text = $message['text']['body'] ?? '';
                                break;
                            case 'interactive':
                                $interactive = $message['interactive'] ?? [];
                                if (isset($interactive['button_reply'])) {
                                    $text = $interactive['button_reply']['id'] ?? $interactive['button_reply']['title'] ?? '';
                                } elseif (isset($interactive['list_reply'])) {
                                    $text = $interactive['list_reply']['id'] ?? $interactive['list_reply']['title'] ?? '';
                                }
                                break;
                            case 'button':
                                $text = $message['button']['text'] ?? '';
                                break;
                        }

                        $mediaId = $message['image']['id'] ?? $message['document']['id'] ?? null;
                        if ($mediaId && $text === '') {
                            $text = $message['image']['caption'] ?? $message['document']['caption'] ?? 'Comprobante recibido';
                        }

                        // Obtener nombre del contacto
                        $name = null;
                        foreach ($contacts as $contact) {
                            if ($contact['wa_id'] === $from) {
                                $name = $contact['profile']['name'] ?? null;
                                break;
                            }
                        }

                        if ($from && ($text || $mediaId)) {
                            $messages[] = [
                                'from' => $from,
                                'message_id' => $messageId,
                                'text' => $text,
                                'type' => $type,
                                'name' => $name,
                                'media_id' => $mediaId,
                                'media_extension' => isset($message['image']) ? 'jpg' : (isset($message['document']) ? 'pdf' : 'bin'),
                                'caption' => $message['image']['caption'] ?? $message['document']['caption'] ?? '',
                            ];
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error extrayendo mensajes: ' . $e->getMessage());
        }

        return $messages;
    }

    /**
     * Enviar mensaje manual
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'to' => 'required|string',
            'text' => 'nullable|string',
            'type' => 'nullable|string|in:text,menu,payment_menu,problems_menu',
        ]);

        try {
            $type = $validated['type'] ?? 'text';
            $result = null;

            switch ($type) {
                case 'text':
                    $result = $this->whatsAppAPIService->sendTextMessage(
                        $validated['to'],
                        $validated['text'] ?? ''
                    );
                    break;
                case 'menu':
                    $result = $this->whatsAppAPIService->sendMainMenu($validated['to']);
                    break;
                case 'payment_menu':
                    $result = $this->whatsAppAPIService->sendPaymentMenu($validated['to']);
                    break;
                case 'problems_menu':
                    $result = $this->whatsAppAPIService->sendProblemsMenu($validated['to']);
                    break;
            }

            return response()->json([
                'success' => $result['success'] ?? false,
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Estado de la API
     */
    public function status()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'mode' => config('whatsapp.development_mode') ? 'development' : 'production',
                'api_url' => config('whatsapp.api_url'),
                'phone_number_id' => config('whatsapp.phone_number_id') ? 'configured' : 'not_configured',
                'access_token' => config('whatsapp.access_token') ? 'configured' : 'not_configured',
                'webhook_configured' => config('whatsapp.verify_token') ? true : false,
                'ia_enabled' => filter_var(env('IA_ENABLED', false), FILTER_VALIDATE_BOOL),
                'ia_provider' => env('AI_PROVIDER', 'groq'),
                'ia_model' => env('AI_PROVIDER') === 'groq'
                    ? env('GROQ_MODEL', 'llama-3.1-8b-instant')
                    : env('OLLAMA_MODEL', 'qwen3:8b'),
            ]
        ]);
    }
}
