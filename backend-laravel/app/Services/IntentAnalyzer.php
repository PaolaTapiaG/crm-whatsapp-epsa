<?php

namespace App\Services;

use App\Models\Intent;
use Illuminate\Support\Facades\Log;

class IntentAnalyzer
{
    /**
     * Analizar mensaje y detectar intención
     */
    public function analyze(string $text)
    {
        $textLower = strtolower($text);
        
        // 1. Buscar en intenciones configuradas
        $intents = Intent::where('is_active', true)
            ->orderBy('priority', 'desc')
            ->get();

        $bestMatch = null;
        $bestScore = 0;

        foreach ($intents as $intent) {
            $score = $this->calculateMatchScore($textLower, $intent);
            
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $intent;
            }
        }

        // 2. Si hay match con buena confianza
        if ($bestMatch && $bestScore > 0) {
            return [
                'intent' => $bestMatch->name,
                'confidence' => $bestScore,
                'sentiment' => $this->analyzeSentiment($textLower),
                'requires_action' => $bestMatch->requires_action,
                'matched_keywords' => $this->getMatchedKeywords($textLower, $bestMatch)
            ];
        }

        // 3. Si no hay match, análisis básico
        return [
            'intent' => 'consulta_general',
            'confidence' => 0.5,
            'sentiment' => $this->analyzeSentiment($textLower),
            'requires_action' => 'none',
            'matched_keywords' => []
        ];
    }

    /**
     * Calcular score de coincidencia
     */
    private function calculateMatchScore(string $text, Intent $intent)
    {
        $keywords = $intent->keywords ?? [];
        $matchedCount = 0;
        $totalKeywords = count($keywords);

        if ($totalKeywords === 0) {
            return 0;
        }

        foreach ($keywords as $keyword) {
            if (str_contains($text, strtolower($keyword))) {
                $matchedCount++;
            }
        }

        return $matchedCount / $totalKeywords;
    }

    /**
     * Obtener keywords que coincidieron
     */
    private function getMatchedKeywords(string $text, Intent $intent)
    {
        $matched = [];
        $keywords = $intent->keywords ?? [];

        foreach ($keywords as $keyword) {
            if (str_contains($text, strtolower($keyword))) {
                $matched[] = $keyword;
            }
        }

        return $matched;
    }

    /**
     * Análisis de sentimiento básico
     */
    private function analyzeSentiment(string $text)
    {
        $positiveWords = [
            'bien', 'excelente', 'genial', 'gracias', 'feliz', 'perfecto',
            'me encanta', 'bueno', 'maravilloso', 'fantástico'
        ];
        
        $negativeWords = [
            'mal', 'pésimo', 'terrible', 'horrible', 'frustrado', 'enojado',
            'decepcionado', 'problema', 'error', 'falla', 'no funciona'
        ];

        $positiveCount = 0;
        $negativeCount = 0;

        foreach ($positiveWords as $word) {
            if (str_contains($text, $word)) {
                $positiveCount++;
            }
        }

        foreach ($negativeWords as $word) {
            if (str_contains($text, $word)) {
                $negativeCount++;
            }
        }

        if ($positiveCount > $negativeCount) {
            return 0.7;
        } elseif ($negativeCount > $positiveCount) {
            return -0.7;
        } else {
            return 0.0;
        }
    }
}
