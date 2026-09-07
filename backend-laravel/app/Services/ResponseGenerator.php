<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Conversation;
use App\Models\Intent;
use Illuminate\Support\Facades\Log;

class ResponseGenerator
{
    /**
     * Generar respuesta basada en análisis
     */
    public function generate(Client $client, Conversation $conversation, string $text, array $analysis)
    {
        // 1. Buscar template de respuesta
        $intent = Intent::where('name', $analysis['intent'])->first();
        
        if ($intent && $intent->response_template) {
            return $this->personalizeResponse($intent->response_template, $client);
        }

        // 2. Respuestas por defecto según intención
        return $this->getDefaultResponse($analysis, $client);
    }

    /**
     * Personalizar respuesta con información del cliente
     */
    private function personalizeResponse(string $template, Client $client)
    {
        // Reemplazar variables
        $replacements = [
            '{nombre}' => $client->name ?? 'cliente',
            '{numero_cliente}' => $client->metadata['account_number'] ?? $client->id,
        ];

        return str_replace(
            array_keys($replacements),
            array_values($replacements),
            $template
        );
    }

    /**
     * Obtener respuesta por defecto
     */
    private function getDefaultResponse(array $analysis, Client $client)
    {
        $responses = [
            'saludo' => '¡Hola! 👋 ¿En qué puedo ayudarte hoy?',
            'consultar_saldo' => 'Para consultar tu saldo, necesito tu número de cliente. ¿Podrías proporcionármelo?',
            'reportar_fuga' => 'Lamento escuchar sobre la fuga. He creado un ticket de soporte. Un técnico te contactará pronto.',
            'falta_suministro' => 'Entiendo que no tienes agua. Déjame verificar si hay cortes programados en tu zona.',
            'queja' => 'Lamento mucho tu experiencia. He registrado tu queja y la escalaré al departamento correspondiente.',
            'solicitar_servicio' => '¡Excelente! Me encantaría ayudarte a solicitar el servicio. ¿Podrías darme tu dirección?',
            'despedida' => '¡Gracias por contactarnos! Que tengas un excelente día 😊',
            'consulta_general' => 'Gracias por tu mensaje. ¿Podrías darme más detalles para ayudarte mejor?',
        ];

        return $responses[$analysis['intent']] ?? $responses['consulta_general'];
    }

    /**
     * Generar respuesta de error
     */
    public function generateErrorResponse()
    {
        return 'Lo siento, estoy teniendo problemas técnicos. Por favor, intenta nuevamente en unos minutos.';
    }

    /**
     * Generar respuesta de transferencia
     */
    public function generateTransferResponse()
    {
        return 'Voy a transferirte con un agente humano que podrá ayudarte mejor. Por favor, espera un momento.';
    }
}
