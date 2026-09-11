<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class WhatsAppAPIService
{
    private string $apiUrl;
    private string $phoneNumberId;
    private string $accessToken;

    public function __construct()
    {
        $this->apiUrl = rtrim((string) config('whatsapp.api_url'), '/');
        $this->phoneNumberId = (string) config('whatsapp.phone_number_id');
        $this->accessToken = (string) config('whatsapp.access_token');
    }

    public function sendTextMessage(string $to, string $text): array
    {
        return $this->send($to, [
            'type' => 'text',
            'text' => ['preview_url' => false, 'body' => $text],
        ]);
    }

    public function sendImage(string $to, UploadedFile $file): array
    {
        $mediaId = $this->uploadMedia($file->getRealPath(), $file->getMimeType() ?: 'image/jpeg');
        return $this->send($to, ['type' => 'image', 'image' => ['id' => $mediaId]]);
    }

    public function sendDocument(string $to, string $path, string $filename): array
    {
        $mediaId = $this->uploadMedia($path, 'application/pdf');
        return $this->send($to, ['type' => 'document', 'document' => ['id' => $mediaId, 'filename' => $filename]]);
    }

    public function sendLocation(string $to, float $latitude, float $longitude, string $name, string $address): array
    {
        return $this->send($to, [
            'type' => 'location',
            'location' => [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'name' => $name,
                'address' => $address,
            ],
        ]);
    }

    public function updateBusinessProfile(array $profile, ?UploadedFile $photo = null): array
    {
        $payload = [
            'messaging_product' => 'whatsapp',
            'about' => $profile['about'] ?? '',
            'address' => $profile['address'] ?? '',
            'description' => $profile['description'] ?? '',
            'vertical' => 'PROF_SERVICES',
            'websites' => array_values(array_filter([
                $profile['website'] ?? null,
            ])),
        ];

        if ($photo) {
            $payload['profile_picture_handle'] = $this->uploadMedia($photo->getRealPath(), $photo->getMimeType() ?: 'image/jpeg');
        }

        $response = Http::connectTimeout(2)->timeout(10)
            ->withToken($this->accessToken)
            ->acceptJson()
            ->post("{$this->apiUrl}/{$this->phoneNumberId}/whatsapp_business_profile", $payload);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('WhatsApp Business Profile API error', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            throw new \RuntimeException($response->json('error.message') ?? 'WhatsApp rechazó la actualización del perfil.');
        }

        return ['success' => true, 'data' => $response->json()];
    }

    public function getBusinessProfile(): array
    {
        $response = Http::connectTimeout(2)->timeout(10)
            ->withToken($this->accessToken)
            ->acceptJson()
            ->get("{$this->apiUrl}/{$this->phoneNumberId}/whatsapp_business_profile", [
                'fields' => 'about,address,description,email,vertical,websites,profile_picture_url',
            ]);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('WhatsApp Business Profile fetch error', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            throw new \RuntimeException($response->json('error.message') ?? 'WhatsApp rechazó la consulta del perfil.');
        }

        return ['success' => true, 'data' => $response->json('data.0', $response->json())];
    }

    public function downloadIncomingMedia(string $mediaId, string $extension = 'bin'): ?string
    {
        $media = Http::withToken($this->accessToken)->get("{$this->apiUrl}/{$mediaId}");
        if ($media->failed() || !$media->json('url')) return null;
        $binary = Http::withToken($this->accessToken)->get($media->json('url'));
        if ($binary->failed()) return null;
        $path = 'proofs/' . $mediaId . '.' . $extension;
        return Storage::disk('public')->put($path, $binary->body())
            ? rtrim(config('app.url'), '/') . '/media/' . $path
            : null;
    }

    public function sendInteractiveMenu(string $to, string $body, array $buttons): array
    {
        if (count($buttons) > 3) {
            throw new \InvalidArgumentException('WhatsApp permite un máximo de 3 botones por mensaje.');
        }

        return $this->send($to, [
            'type' => 'interactive',
            'interactive' => [
                'type' => 'button',
                'body' => ['text' => $body],
                'action' => ['buttons' => $buttons],
            ],
        ]);
    }

    public function sendMainMenu(string $to, string $clientName = ''): array
    {
        $greeting = $clientName !== '' ? "Hola {$clientName}" : 'Hola';

        return $this->sendInteractiveMenu($to, "{$greeting}. Bienvenido al servicio de agua. ¿En qué puedo ayudarte?", [
            $this->button('menu_saldo', 'Consultar saldo'),
            $this->button('menu_pagar', 'Pagar deuda'),
            $this->button('menu_horarios', 'Horarios'),
        ]);
    }

    public function sendProblemsMenu(string $to): array
    {
        return $this->sendInteractiveMenu($to, 'Selecciona el tipo de problema:', [
            $this->button('problema_rotura', 'Rotura de caneria'),
            $this->button('problema_fuga', 'Fuga en casa'),
            $this->button('problema_agua', 'No tengo agua'),
        ]);
    }

    public function sendPaymentMenu(string $to): array
    {
        return $this->sendInteractiveMenu($to, 'Selecciona el metodo de pago:', [
            $this->button('pago_qr', 'QR Simple'),
            $this->button('pago_transferencia', 'Transferencia'),
            $this->button('pago_oficina', 'En oficina'),
        ]);
    }

    public function processWebhook(array $payload): array
    {
        if (isset($payload['from'], $payload['text'])) {
            return [$payload + ['message_id' => null, 'type' => 'text', 'name' => null]];
        }

        $value = data_get($payload, 'entry.0.changes.0.value', []);
        $contacts = collect(data_get($value, 'contacts', []))->keyBy('wa_id');

        return collect(data_get($value, 'messages', []))->map(function (array $message) use ($contacts): array {
            $type = $message['type'] ?? 'text';
            $text = match ($type) {
                'text' => data_get($message, 'text.body', ''),
                'button' => data_get($message, 'button.text', ''),
                'interactive' => $this->interactiveText($message),
                default => '',
            };

            return [
                'from' => $message['from'] ?? null,
                'message_id' => $message['id'] ?? null,
                'text' => $text,
                'type' => $type,
                'timestamp' => $message['timestamp'] ?? null,
                'name' => data_get($contacts->get($message['from'] ?? ''), 'profile.name'),
            ];
        })->filter(fn (array $message) => filled($message['from']) && filled($message['text']))->values()->all();
    }

    public function markAsRead(string $messageId): array
    {
        return $this->send('', [
            'status' => 'read',
            'message_id' => $messageId,
        ], false);
    }

    private function send(string $to, array $payload, bool $includeRecipient = true): array
    {
        if ($this->phoneNumberId === '' || $this->accessToken === '') {
            if ((bool) config('whatsapp.development_mode')) {
                Log::channel('whatsapp')->info('WhatsApp Cloud API simulada en modo desarrollo', [
                    'to' => $to,
                    'payload' => $payload,
                ]);

                return [
                    'success' => true,
                    'simulated' => true,
                    'data' => [
                        'messages' => [[
                            'id' => 'dev-' . uniqid(),
                        ]],
                    ],
                ];
            }

            throw new \RuntimeException('WhatsApp Cloud API no está configurada correctamente.');
        }

        if ($includeRecipient) {
            $payload = ['messaging_product' => 'whatsapp', 'recipient_type' => 'individual', 'to' => preg_replace('/[^0-9]/', '', $to)] + $payload;
        } else {
            $payload = ['messaging_product' => 'whatsapp'] + $payload;
        }

        $response = Http::connectTimeout(2)->timeout(4)
            ->withToken($this->accessToken)
            ->acceptJson()
            ->post("{$this->apiUrl}/{$this->phoneNumberId}/messages", $payload);

        if ($response->failed()) {
            Log::channel('whatsapp')->error('WhatsApp Cloud API error', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            throw new \RuntimeException($response->json('error.message') ?? 'WhatsApp Cloud API rechazó la solicitud.');
        }

        return ['success' => true, 'data' => $response->json()];
    }

    private function uploadMedia(string $path, string $mime): string
    {
        if (($this->phoneNumberId === '' || $this->accessToken === '') && (bool) config('whatsapp.development_mode')) {
            return 'dev-media-' . uniqid();
        }

        $response = Http::connectTimeout(2)->timeout(4)
            ->withToken($this->accessToken)
            ->attach('file', fopen($path, 'rb'), basename($path), [
                'Content-Type' => $mime,
            ])
            ->post("{$this->apiUrl}/{$this->phoneNumberId}/media", [
                'messaging_product' => 'whatsapp',
                'type' => $mime,
            ]);

        if ($response->failed() || !$response->json('id')) {
            throw new \RuntimeException($response->json('error.message') ?? 'No se pudo subir el archivo a WhatsApp.');
        }

        return $response->json('id');
    }

    private function button(string $id, string $title): array
    {
        return ['type' => 'reply', 'reply' => ['id' => $id, 'title' => $title]];
    }

    private function interactiveText(array $message): string
    {
        $interactive = $message['interactive'] ?? [];
        $id = data_get($interactive, 'button_reply.id') ?? data_get($interactive, 'list_reply.id');
        $title = data_get($interactive, 'button_reply.title') ?? data_get($interactive, 'list_reply.title');

        return [
            'menu_saldo' => 'consultar_saldo',
            'menu_pagar' => 'pagar_deuda',
            'menu_horarios' => 'horarios',
            'problema_rotura' => 'rotura_caneria',
            'problema_fuga' => 'fuga_casa',
            'problema_agua' => 'falta_agua',
            'pago_qr' => 'pagar_qr',
            'pago_transferencia' => 'pagar_transferencia',
            'pago_oficina' => 'pagar_oficina',
        ][$id] ?? $title ?? '';
    }
}
