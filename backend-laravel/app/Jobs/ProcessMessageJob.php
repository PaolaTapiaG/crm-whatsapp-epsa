<?php

namespace App\Jobs;

use App\Exceptions\WhatsAppQuotaExceededException;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsAppAPIService;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Bus\Batchable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;

class ProcessMessageJob implements ShouldQueue
{
    use Batchable, Queueable;

    public int $tries = 3;
    public int $timeout = 90;
    public bool $failOnTimeout = true;

    public function __construct(public array $payload)
    {
        $this->onQueue('whatsapp');
    }

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function middleware(): array
    {
        $key = $this->payload['message_id'] ?? $this->payload['from'] ?? uniqid('message-', true);

        return [new WithoutOverlapping('whatsapp-message:' . $key)];
    }

    /**
     * Create a new job instance.
     */
    public function handle(WhatsAppService $whatsApp, WhatsAppAPIService $whatsAppApi): void
    {
        $messageId = $this->payload['message_id'] ?? null;
        if ($messageId) {
            try {
                $whatsAppApi->markAsRead($messageId);
            } catch (\Throwable $exception) {
                if (!$this->isPermanentClientError($exception)) {
                    throw $exception;
                }
                Log::channel('whatsapp')->warning('Meta rechazó marcar el mensaje como leído', [
                    'message_id' => $messageId,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $result = $whatsApp->processIncomingMessage($this->payload);
        if (($result['success'] ?? false) !== true) {
            throw new \RuntimeException($result['error'] ?? 'El procesamiento del mensaje falló.');
        }

        Log::channel('whatsapp')->info('Intent detectado por Job', [
            'message_id' => $this->payload['message_id'] ?? null,
            'conversation_id' => $result['conversation_id'] ?? null,
            'intent' => $result['analysis']['intent'] ?? 'unknown',
        ]);

        if (!empty($this->payload['media_id'])) {
            try {
                $mediaUrl = $whatsAppApi->downloadIncomingMedia(
                    $this->payload['media_id'],
                    $this->payload['media_extension'] ?? 'bin'
                );
            } catch (\Throwable $exception) {
                if ($exception instanceof WhatsAppQuotaExceededException) {
                    $this->activateEmergencyMode($exception->quota);
                    return;
                }
                if ($this->isPermanentClientError($exception)) {
                    Log::channel('whatsapp')->warning('Meta rechazó la descarga del media', [
                        'media_id' => $this->payload['media_id'],
                        'error' => $exception->getMessage(),
                    ]);
                    return;
                }
                throw $exception;
            }
            $conversation = \App\Models\Conversation::where('session_id', 'wa-' . $this->payload['from'])->latest()->first();
            $stored = $conversation?->messages()->where('sender', 'user')->latest()->first();
            if ($stored) {
                $metadata = $stored->metadata ?? [];
                $metadata['kind'] = 'payment_proof';
                $metadata['media_url'] = $mediaUrl;
                $proofText = $this->payload['caption'] ?? 'Comprobante recibido';
                $stored->update(['metadata' => $metadata, 'text' => $proofText, 'content' => $proofText]);
            }
            $result['response'] = 'Su pago esta en revision por el operador, espere unos minutos antes de recibir su factura.';
        }

        if (($result['success'] ?? false) && !empty($result['response'])) {
            try {
                $whatsAppApi->sendTextMessage($this->payload['from'], $result['response']);
                Log::channel('whatsapp')->info('Respuesta enviada por WhatsApp', [
                    'conversation_id' => $result['conversation_id'] ?? null,
                ]);
            } catch (\Throwable $exception) {
                if ($this->isPermanentClientError($exception)) {
                    Log::channel('whatsapp')->error('Meta rechazó el mensaje sin reintento', [
                        'from' => $this->payload['from'],
                        'error' => $exception->getMessage(),
                    ]);
                    return;
                }
                throw $exception;
            }
        }
    }

    private function activateEmergencyMode(array $quota): void
    {
        $conversation = Conversation::where('session_id', 'wa-' . ($this->payload['from'] ?? ''))
            ->latest()
            ->first();

        if ($conversation) {
            $conversation->update([
                'status' => 'transferred',
                'priority' => 'high',
                'context' => array_merge($conversation->context ?? [], [
                    'operator_required' => true,
                    'quota_emergency' => true,
                    'quota_status' => $quota['status'] ?? 'exceeded',
                ]),
            ]);

            Message::create([
                'conversation_id' => $conversation->id,
                'sender' => 'system',
                'sender_type' => 'system',
                'text' => 'Emergencia de cuota: no se envio respuesta automatica porque se supero la cuota mensual gratuita de WhatsApp.',
                'content' => 'Emergencia de cuota: no se envio respuesta automatica porque se supero la cuota mensual gratuita de WhatsApp.',
                'internal' => true,
                'metadata' => [
                    'kind' => 'quota_emergency',
                    'quota' => $quota,
                ],
            ]);
        }

        Log::channel('whatsapp')->critical('Cuota mensual de WhatsApp superada; respuesta automatica bloqueada', [
            'from' => $this->payload['from'] ?? null,
            'quota' => $quota,
        ]);
    }

    private function isPermanentClientError(\Throwable $exception): bool
    {
        $status = (int) $exception->getCode();

        return $status >= 400 && $status < 500 && !in_array($status, [408, 429], true);
    }

    public function failed(\Throwable $exception): void
    {
        Log::channel('whatsapp')->error('Procesamiento de mensaje agotó reintentos', [
            'message_id' => $this->payload['message_id'] ?? null,
            'from' => $this->payload['from'] ?? null,
            'error' => $exception->getMessage(),
        ]);
    }
}
