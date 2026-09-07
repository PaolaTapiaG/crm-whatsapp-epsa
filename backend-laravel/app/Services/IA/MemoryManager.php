<?php

namespace App\Services\IA;

use App\Models\Conversation;

class MemoryManager
{
    public function remember(Conversation $conversation, array $facts): void
    {
        $context = $conversation->context ?? [];
        $memory = $context['memoria'] ?? [];

        foreach ($facts as $key => $value) {
            if ($value !== null && $value !== '') {
                $memory[$key] = $value;
            }
        }

        $conversation->update(['context' => array_merge($context, [
            'memoria' => $memory,
        ])]);
    }

    public function rememberFromText(Conversation $conversation, string $text, OllamaService $ollamaService): void
    {
        $this->remember($conversation, $ollamaService->extractEntities($text));
    }

    public function rememberLocalFacts(Conversation $conversation, string $text): void
    {
        $facts = [];

        if (preg_match('/(?:mi nombre es|soy)\s+([\p{L}]+(?:\s+(?!y\b)[\p{L}]+){0,2})/iu', $text, $matches)) {
            $facts['nombre'] = trim($matches[1]);
        }
        if (preg_match('/\b\d{6,8}\b/', $text, $matches)) {
            $facts['medidor'] = $matches[0];
        }
        if (preg_match('/\b(norte|sur|este|oeste|centro)\b/i', $text, $matches)) {
            $facts['zona'] = strtolower($matches[1]);
        }

        if ($facts) {
            $this->remember($conversation, $facts);
        }
    }

    public function get(Conversation $conversation): array
    {
        return ($conversation->context ?? [])['memoria'] ?? [];
    }
}