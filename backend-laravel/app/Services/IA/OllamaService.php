<?php

namespace App\Services\IA;

use App\Models\Client;
use App\Models\Conversation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected $baseUrl;
    protected $model;

    public function __construct()
    {
        $this->baseUrl = env('OLLAMA_URL', 'http://localhost:11434');
        $this->model = env('OLLAMA_MODEL', 'qwen3:8b');
    }

    /**
     * Generar respuesta usando Ollama
     */
    public function generateResponse(string $prompt, array $context = [])
    {
        return $this->requestOllama($prompt, $context, true);
    }

    public function generateTextResponse(string $prompt): ?string
    {
        $result = $this->requestOllama($prompt, [], false);

        return $result['response'] ?? null;
    }

    private function requestOllama(string $prompt, array $context = [], bool $json = true): ?array
    {
        try {
            $payload = [
                'model' => $this->model,
                'prompt' => $prompt,
                'stream' => false,
                'context' => $context,
                'options' => [
                    'temperature' => $json ? 0.2 : 0.65,
                    'top_p' => 0.9,
                    'num_predict' => 80,
                ],
            ];

            if ($json) {
                $payload['format'] = 'json';
            }

            $response = Http::connectTimeout(1)->timeout((int) env('OLLAMA_TIMEOUT', 2))->post("{$this->baseUrl}/api/generate", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Error en Ollama', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Error conectando con Ollama: ' . $e->getMessage());
            return null;
        }
    }

    public function analyzeWithExamples(string $message): array
    {
        $prompt = <<<PROMPT
Eres un clasificador de una empresa de agua potable en Bolivia.
Usa estos ejemplos como guía:
Usuario: "Hola" -> saludo
Usuario: "Quiero saber mi deuda" -> consultar_saldo
Usuario: "Necesito pagar" -> pagar_deuda
Usuario: "¿A qué hora abren?" -> horarios
Usuario: "Hay una rotura en mi calle" -> rotura_caneria
Usuario: "Tengo una fuga en el baño" -> fuga_casa
Usuario: "No tengo agua" -> falta_agua
Usuario: "Quiero hablar con una persona" -> hablar_operador

Clasifica este mensaje: "{$message}"
Responde JSON con intent, confidence, sentiment y entities.
PROMPT;

        return $this->decodeJson($this->generateResponse($prompt));
    }

    public function generatePersonalizedResponse(Client $client, string $intent, array $data = []): ?string
    {
        $name = $client->name ?: 'la persona usuaria';
        $prompt = "Genera una respuesta breve, amable y profesional en español boliviano para {$name}.\n" .
            "Intención: {$intent}\nDatos: " . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n" .
            "No inventes datos ni afirmes acciones que no se hayan realizado.";

        return $this->generateTextResponse($prompt);
    }

    public function analyzeEmotion(string $message): array
    {
        $prompt = "Analiza este mensaje: \"{$message}\". Responde JSON con emocion, urgencia y tono. " .
            "Usa urgencia baja, media, alta o critica; no inventes contexto.";

        return $this->decodeJson($this->generateResponse($prompt));
    }

    public function extractEntities(string $message): array
    {
        $prompt = "Extrae entidades de este mensaje: \"{$message}\". Responde JSON con " .
            "medidor, ci, direccion, zona, monto y fecha. Usa null cuando no exista.";

        return $this->decodeJson($this->generateResponse($prompt));
    }

    public function recommendSolution(string $problem): array
    {
        $prompt = "Para este problema de agua: \"{$problem}\", responde JSON con " .
            "accion_inmediata, tipo_ticket, prioridad y tiempo_estimado. No inventes disponibilidad.";

        return $this->decodeJson($this->generateResponse($prompt));
    }

    public function translateMessage(string $message, string $targetLanguage = 'es'): ?string
    {
        return $this->generateTextResponse("Traduce o mejora al idioma {$targetLanguage}: \"{$message}\". Devuelve solo el texto.");
    }

    public function multiTurnDialogue(Conversation $conversation, string $userInput): ?string
    {
        $history = $conversation->messages()->orderBy('created_at')->take(10)->get()
            ->map(fn ($message) => ($message->sender === 'user' ? 'Usuario: ' : 'Asistente: ') . $message->text)
            ->implode("\n");

        return $this->generateTextResponse("Eres un asistente de agua potable.\n{$history}\nUsuario: {$userInput}\n" .
            "Responde de manera contextual, breve y natural. No inventes datos privados.");
    }

    public function summarizeConversation(Conversation $conversation): ?string
    {
        $messages = $conversation->messages()->orderBy('created_at')->get()
            ->map(fn ($message) => "{$message->sender}: {$message->text}")
            ->implode("\n");

        return $this->generateTextResponse("Resume esta conversación de servicio:\n{$messages}\n" .
            "Incluye problema principal, solución ofrecida, estado actual y siguientes pasos.");
    }

    private function decodeJson(?array $result): array
    {
        if (!$result || empty($result['response'])) {
            return [];
        }

        $decoded = json_decode($result['response'], true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Analizar mensaje y detectar intención
     */
    public function analyzeMessage(string $message, array $conversationHistory = [])
    {
        $prompt = $this->buildAnalysisPrompt($message, $conversationHistory);
        
        $result = $this->generateResponse($prompt);
        
        if ($result && isset($result['response'])) {
            return $this->parseAnalysisResponse($result['response']);
        }

        return $this->fallbackAnalysis($message);
    }

    /**
     * Construir prompt para análisis
     */
    private function buildAnalysisPrompt(string $message, array $history)
    {
        $historyText = '';
        foreach (array_slice($history, -5) as $item) {
            $historyText .= "{$item['role']}: {$item['content']}\n";
        }

        return <<<PROMPT
    Eres un clasificador de mensajes para una empresa de agua potable en Bolivia.
    Responde exclusivamente con un objeto JSON válido, sin markdown ni texto adicional.

Historial de conversación:
{$historyText}

Mensaje actual: "{$message}"

Ejemplos de clasificación:
Usuario: "Hola" -> {"intent":"saludo","confidence":98}
Usuario: "Quiero saber mi deuda" -> {"intent":"consultar_saldo","confidence":95}
Usuario: "Necesito pagar" -> {"intent":"pagar_deuda","confidence":93}
Usuario: "¿A qué hora abren?" -> {"intent":"horarios","confidence":96}
Usuario: "No tengo agua" -> {"intent":"falta_agua","confidence":95}

Debes detectar:
1. Intención principal: 
   - saludo (hola, buenos días)
   - consultar_saldo (quiero saber mi deuda)
   - pagar_deuda (quiero pagar)
   - horarios (horarios de atención)
    - problemas_servicio (problemas con el agua)
   - rotura_caneria (rotura en la calle)
   - fuga_casa (fuga en mi casa)
   - falta_agua (no tengo agua)
    - fecha_hora (pregunta qué día, fecha u hora es)
   - hablar_operador (quiero hablar con humano)
   - despedida (adiós, gracias)
     - consulta_general (pregunta informativa sin datos privados)
   - otro

2. Sentimiento: positivo, negativo, neutral
3. Confianza: 0-100
4. Entidades detectadas: número de medidor, CI, dirección

Si el mensaje es una opción del menú, usa estas equivalencias: 1/A saldo, 2/B pago, 3/C horarios, 4/D problemas, 5/E operador.
Para consulta_general, responde de forma breve, natural y amable. No inventes datos en tiempo real, no afirmes haber consultado sistemas externos y no solicites ni reveles datos privados.

Responde SOLO en JSON:
{
  "intent": "intencion_detectada",
  "sentiment": "positivo|negativo|neutral",
  "confidence": 85,
    "response": "respuesta breve, natural y útil en español",
  "entities": {
    "medidor": null,
    "ci": null,
    "direccion": null
  }
}
PROMPT;
    }

    /**
     * Parsear respuesta de análisis
     */
    private function parseAnalysisResponse(string $response)
    {
        // Intentar extraer JSON
        if (preg_match('/\{.*\}/s', $response, $matches)) {
            $json = json_decode($matches[0], true);
            if ($json) {
                return $json;
            }
        }

        return $this->fallbackAnalysis('');
    }

    /**
     * Análisis de respaldo basado en reglas
     */
    private function fallbackAnalysis(string $message)
    {
        $message = strtolower($message);
        
        if (str_contains($message, 'hola') || str_contains($message, 'buenos')) {
            return ['intent' => 'saludo', 'sentiment' => 'positivo', 'confidence' => 95];
        }
        if (str_contains($message, 'saldo') || str_contains($message, 'debo')) {
            return ['intent' => 'consultar_saldo', 'sentiment' => 'neutral', 'confidence' => 90];
        }
        if (str_contains($message, 'pagar')) {
            return ['intent' => 'pagar_deuda', 'sentiment' => 'neutral', 'confidence' => 88];
        }
        if (str_contains($message, 'horario')) {
            return ['intent' => 'horarios', 'sentiment' => 'neutral', 'confidence' => 90];
        }
        if (str_contains($message, 'que dia es') || str_contains($message, 'que fecha es')) {
            return ['intent' => 'fecha_hora', 'sentiment' => 'neutral', 'confidence' => 95];
        }
        if (str_contains($message, 'rotura') || str_contains($message, 'cañería')) {
            return ['intent' => 'rotura_caneria', 'sentiment' => 'negativo', 'confidence' => 92];
        }
        if (str_contains($message, 'fuga') && str_contains($message, 'casa')) {
            return ['intent' => 'fuga_casa', 'sentiment' => 'negativo', 'confidence' => 90];
        }
        if (str_contains($message, 'no tengo agua') || str_contains($message, 'sin agua')) {
            return ['intent' => 'falta_agua', 'sentiment' => 'negativo', 'confidence' => 90];
        }
        if (str_contains($message, 'operador') || str_contains($message, 'humano')) {
            return ['intent' => 'hablar_operador', 'sentiment' => 'neutral', 'confidence' => 85];
        }
        
        return ['intent' => 'otro', 'sentiment' => 'neutral', 'confidence' => 50];
    }
}
