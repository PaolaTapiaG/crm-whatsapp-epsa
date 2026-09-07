<?php

namespace App\Services;

use App\Models\Message;
use App\Models\Conversation;
use Illuminate\Support\Facades\Log;

class MessageProcessor
{
    /**
     * Procesar mensaje y extraer información
     */
    public function process(Conversation $conversation, string $text, string $sender)
    {
        $cleanText = $this->cleanText($text);
        
        return [
            'conversation_id' => $conversation->id,
            'sender' => $sender,
            'text' => $cleanText,
            'metadata' => [
                'original_length' => strlen($text),
                'processed_length' => strlen($cleanText),
                'has_emoji' => $this->hasEmoji($text),
                'language_detected' => $this->detectLanguage($text)
            ]
        ];
    }

    /**
     * Limpiar texto
     */
    private function cleanText(string $text)
    {
        // Eliminar espacios extras
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Eliminar caracteres especiales
        $text = strip_tags($text);
        
        return trim($text);
    }

    /**
     * Detectar si hay emojis
     */
    private function hasEmoji(string $text)
    {
        return preg_match('/[\x{1F600}-\x{1F64F}]/u', $text) === 1;
    }

    /**
     * Detectar idioma (simplificado)
     */
    private function detectLanguage(string $text)
    {
        // Palabras comunes en español
        $spanishWords = ['hola', 'gracias', 'por favor', 'buenos', 'días', 'tardes'];
        $textLower = strtolower($text);
        
        foreach ($spanishWords as $word) {
            if (str_contains($textLower, $word)) {
                return 'es';
            }
        }
        
        return 'unknown';
    }

    /**
     * Validar mensaje
     */
    public function validate(string $text)
    {
        if (empty($text) || strlen($text) < 2) {
            return [
                'valid' => false,
                'reason' => 'Mensaje muy corto'
            ];
        }

        if (strlen($text) > 4000) {
            return [
                'valid' => false,
                'reason' => 'Mensaje muy largo'
            ];
        }

        return [
            'valid' => true
        ];
    }
}
