<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsAppAPIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OperatorController extends Controller
{
    public function __construct(private WhatsAppAPIService $whatsApp)
    {
    }

    public function pending()
    {
        $latestConversationIds = Conversation::query()
            ->selectRaw('MAX(id) as id')
            ->whereIn('status', ['active', 'transferred', 'finished', 'closed'])
            ->groupBy('client_id');

        $conversations = Conversation::with(['client', 'lastMessage'])
            ->whereIn('id', $latestConversationIds)
            ->latest('updated_at')
            ->get();

        return response()->json(['success' => true, 'data' => $conversations]);
    }

    public function messages(string $conversationId)
    {
        $conversation = Conversation::with('client')->findOrFail($conversationId);
        $conversationIds = Conversation::where('client_id', $conversation->client_id)->pluck('id');

        $messages = Message::whereIn('conversation_id', $conversationIds)
            ->latest('created_at')
            ->limit(200)
            ->get()
            ->sortBy('created_at')
            ->values();

        return response()->json([
            'success' => true,
            'conversation' => $conversation,
            'data' => $messages,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $data = $request->validate([
            'to' => 'required|string',
            'text' => 'required|string|max:4096',
            'conversation_id' => 'required|exists:conversations,id',
        ]);

        $result = $this->whatsApp->sendTextMessage($data['to'], $data['text']);
        Message::create([
            'conversation_id' => $data['conversation_id'],
            'sender' => 'human',
            'text' => $data['text'],
            'metadata' => ['channel' => 'whatsapp', 'delivery' => $result['data'] ?? null],
        ]);

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function sendQr(Request $request, string $conversationId)
    {
        $data = $request->validate(['to' => 'required|string', 'qr' => 'required|file|image|max:5120']);
        $storedPath = $request->file('qr')->store('payment-qr', 'public');
        $result = $this->whatsApp->sendImage($data['to'], $data['qr']);
        Message::create([
            'conversation_id' => $conversationId,
            'sender' => 'human',
            'text' => 'Código QR de pago',
            'metadata' => [
                'kind' => 'payment_qr',
                'media_url' => rtrim(config('app.url'), '/') . '/media/' . ltrim($storedPath, '/'),
                'delivery' => $result['data'] ?? null,
            ],
        ]);

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function reviewPayment(Request $request, string $messageId)
    {
        $data = $request->validate(['status' => 'required|in:approved,rejected']);
        $message = Message::with('conversation.client')->findOrFail($messageId);
        $metadata = $message->metadata ?? [];
        $metadata['payment_status'] = $data['status'];
        $message->update(['metadata' => $metadata]);

        $clientNumber = $message->conversation?->client?->whatsapp_number;
        if ($clientNumber) {
            $reply = $data['status'] === 'approved'
                ? 'Pago confirmado correctamente. En unos momentos el operador le enviara su factura en PDF.'
                : 'El comprobante no pudo ser confirmado. Por favor envie una imagen clara o comuniquese con el operador.';
            $this->whatsApp->sendTextMessage($clientNumber, $reply);
            Message::create([
                'conversation_id' => $message->conversation_id,
                'sender' => 'human',
                'text' => $reply,
                'metadata' => ['kind' => 'payment_review', 'payment_status' => $data['status']],
            ]);
        }

        return response()->json(['success' => true, 'data' => $message->fresh()]);
    }

    public function sendInvoice(Request $request, string $conversationId)
    {
        $data = $request->validate([
            'to' => 'required|string',
            'bill_number' => 'required|string|max:80',
            'amount' => 'nullable|numeric|min:0',
            'user_name' => 'nullable|string|max:160',
            'previous_reading' => 'nullable|string|max:40',
            'current_reading' => 'nullable|string|max:40',
            'consumption' => 'nullable|string|max:40',
            'basic_rate' => 'nullable|string|max:40',
            'tier_11_15' => 'nullable|string|max:40',
            'tier_16_20' => 'nullable|string|max:40',
            'tier_20_30' => 'nullable|string|max:40',
            'amount_literal' => 'nullable|string|max:240',
            'day' => 'nullable|string|max:20',
            'month' => 'nullable|string|max:40',
            'year' => 'nullable|string|max:10',
        ]);

        $data['basic_rate'] = $data['basic_rate'] ?? '0';
        $data['tier_11_15'] = $data['tier_11_15'] ?? '0';
        $data['tier_16_20'] = $data['tier_16_20'] ?? '0';
        $data['tier_20_30'] = $data['tier_20_30'] ?? '0';
        if ((float) $data['amount'] === 0.0) {
            $data['amount'] = (string) array_sum(array_map('floatval', [
                $data['basic_rate'], $data['tier_11_15'], $data['tier_16_20'], $data['tier_20_30'],
            ]));
        }
        $pdf = $this->invoicePdf($data);
        $path = 'invoices/' . $data['bill_number'] . '.pdf';
        Storage::disk('public')->put($path, $pdf);
        $result = $this->whatsApp->sendDocument($data['to'], Storage::disk('public')->path($path), 'Factura ' . $data['bill_number'] . '.pdf');
        Message::create([
            'conversation_id' => $conversationId,
            'sender' => 'human',
            'text' => 'Factura enviada: ' . $data['bill_number'],
            'metadata' => [
                'kind' => 'invoice',
                'path' => $path,
                'media_url' => rtrim(config('app.url'), '/') . '/media/' . ltrim($path, '/'),
                'delivery' => $result['data'] ?? null,
            ],
        ]);

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function sendLocation(Request $request, string $conversationId)
    {
        $data = $request->validate([
            'to' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'name' => 'required|string|max:120',
            'address' => 'required|string|max:240',
        ]);

        $mapsLink = 'https://www.openstreetmap.org/?mlat=' . $data['latitude'] . '&mlon=' . $data['longitude'] . '#map=18/' . $data['latitude'] . '/' . $data['longitude'];
        $message = "Ubicacion de {$data['name']}\n{$data['address']}\n{$mapsLink}";
        $result = $this->whatsApp->sendTextMessage($data['to'], $message);

        Message::create([
            'conversation_id' => $conversationId,
            'sender' => 'human',
            'text' => $message,
            'metadata' => ['kind' => 'location_link', 'latitude' => $data['latitude'], 'longitude' => $data['longitude'], 'url' => $mapsLink],
        ]);

        return response()->json(['success' => true, 'data' => $result]);
    }

    public function broadcast(Request $request)
    {
        $data = $request->validate([
            'recipients' => 'required|array|min:1',
            'recipients.*' => 'required|string',
            'text' => 'required|string|max:4096',
            'image' => 'nullable|file|image|max:5120',
        ]);

        $sent = [];
        foreach ($data['recipients'] as $recipient) {
            $sent[] = $request->hasFile('image')
                ? $this->whatsApp->sendImage($recipient, $request->file('image'))
                : $this->whatsApp->sendTextMessage($recipient, $data['text']);
        }

        return response()->json(['success' => true, 'data' => ['sent' => count($sent)]]);
    }

    public function transfer(string $conversationId)
    {
        $conversation = Conversation::with('client')->findOrFail($conversationId);
        $conversation->update(['status' => 'transferred', 'priority' => 'high']);
        $this->whatsApp->sendTextMessage($conversation->client->whatsapp_number, 'Te conectaré con un operador humano.');

        return response()->json(['success' => true]);
    }

    public function close(string $conversationId)
    {
        Conversation::findOrFail($conversationId)->update(['status' => 'finished', 'ended_at' => now()]);

        return response()->json(['success' => true]);
    }

    private function invoicePdf(array $data): string
    {
        $amount = number_format((float) $data['amount'], 2);
        $lines = [
            ['EPSA "EL PORTILLO"', 42, 735, 16, true],
            ['Entidad Prestadora de Servicio de Agua Potable y Saneamiento', 42, 715, 10, false],
            ['RECIBO DE COBRO', 360, 732, 14, true],
            ['DE SERVICIO DE AGUA POTABLE', 318, 714, 11, true],
            ['Nro ' . ($data['bill_number'] ?? ''), 390, 700, 20, true],
            ['NOMBRE DEL USUARIO: ' . ($data['user_name'] ?? ''), 42, 660, 11, true],
            ['LECTURACION', 42, 635, 11, true],
            ['LECT. ANT. M3: ' . ($data['previous_reading'] ?? ''), 62, 605, 10, true],
            ['LECT. ACTUAL. M3: ' . ($data['current_reading'] ?? ''), 245, 605, 10, true],
            ['CONSUMO M3: ' . ($data['consumption'] ?? ''), 430, 605, 10, true],
            ['CONSUMO EN BOLIVIANOS', 42, 555, 11, true],
            ['Tarifa basica 10 m3: ' . ($data['basic_rate'] ?? ''), 55, 528, 9, true],
            ['11 a 15 m3: ' . ($data['tier_11_15'] ?? ''), 180, 528, 9, true],
            ['16 a 20 m3: ' . ($data['tier_16_20'] ?? ''), 295, 528, 9, true],
            ['20 a 30 m3: ' . ($data['tier_20_30'] ?? ''), 410, 528, 9, true],
            ['Total Bs. ' . $amount, 505, 528, 9, true],
            ['Son: ' . ($data['amount_literal'] ?? '') . ' 00/100 Bolivianos', 42, 480, 10, false],
            ['EL PORTILLO, ' . ($data['day'] ?? '') . ' DE ' . ($data['month'] ?? '') . ' DE ' . ($data['year'] ?? date('Y')), 220, 442, 10, true],
            ['ENTREGUE CONFORME', 62, 395, 10, true],
            ['NOTA: Estimado usuario evitese el corte de servicio; por tres meses en mora el servicio sera cortado.', 42, 348, 9, true],
            ['El agua es vida, cuidala', 245, 330, 10, true],
        ];

        $stream = "q 0.95 0.98 1 rg 35 318 542 445 re f Q\n";
        $stream .= "q 0.04 0.25 0.55 RG 1.2 w 38 322 536 438 re S ";
        $stream .= "42 585 500 42 re S 42 510 500 32 re S 220 585 m 220 627 l S 390 585 m 390 627 l S 160 510 m 160 542 l S 275 510 m 275 542 l S 390 510 m 390 542 l S 500 510 m 500 542 l S Q\n";
        $stream .= "BT\n";
        foreach ($lines as [$text, $x, $y, $size, $bold]) {
            $font = $bold ? 'F2' : 'F1';
            $stream .= "/{$font} {$size} Tf 1 0 0 1 {$x} {$y} Tm (" . addcslashes((string) $text, '()\\') . ") Tj\n";
        }
        $stream .= 'ET';
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
            '<< /Length ' . strlen($stream) . " >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1) . " 0 obj\n{$object}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
        foreach (array_slice($offsets, 1) as $offset) $pdf .= sprintf("%010d 00000 n \n", $offset);
        return $pdf . "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
