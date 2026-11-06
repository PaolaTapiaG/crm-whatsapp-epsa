<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Ticket;
use App\Models\TicketHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OfficeIntakeController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id' => 'nullable|integer|exists:clients,id',
            'name' => 'required_without:client_id|nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'source' => 'required|in:office,paper',
            'paper_reference' => 'required_if:source,paper|nullable|string|max:120',
            'received_at' => 'required_if:source,paper|nullable|date|before_or_equal:now',
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:4096',
            'category' => 'required|in:consulta,servicio,queja,reclamo,fuga_casa,rotura_caneria,falta_agua,facturacion,medidor,otro',
            'priority' => 'required|in:low,normal,high,urgent',
        ]);

        $result = DB::transaction(function () use ($data, $request): array {
            $client = isset($data['client_id'])
                ? Client::findOrFail($data['client_id'])
                : Client::create([
                    'name' => trim($data['name']),
                    'phone' => $data['phone'] ?? null,
                    'whatsapp_number' => null,
                    'status' => 'active',
                ]);
            $receivedAt = $data['received_at'] ?? now()->toIso8601String();
            $origin = [
                'source' => $data['source'],
                'received_at' => $receivedAt,
                'paper_reference' => $data['paper_reference'] ?? null,
                'registered_by' => $request->user()?->id,
            ];
            $conversation = Conversation::create([
                'client_id' => $client->id,
                'session_id' => 'office-' . Str::uuid(),
                'channel' => 'office',
                'status' => 'active',
                'priority' => $data['priority'],
                'assigned_to' => $request->user()?->id,
                'started_at' => $receivedAt,
                'metadata' => $origin,
            ]);
            Message::create([
                'conversation_id' => $conversation->id,
                'sender' => 'user',
                'text' => $data['description'],
                'metadata' => ['kind' => 'office_intake'] + $origin,
            ]);
            $ticket = Ticket::create([
                'client_id' => $client->id,
                'conversation_id' => $conversation->id,
                'subject' => $data['subject'],
                'description' => $data['description'],
                'category' => $data['category'],
                'priority' => $data['priority'],
                'status' => $request->user() ? 'assigned' : 'open',
                'assigned_to' => $request->user()?->id,
                'created_by' => $request->user()?->id,
                'metadata' => $origin,
            ]);
            $ticket->update(['ticket_number' => sprintf('TKT-%s-%04d', now()->year, $ticket->id)]);
            $conversation->update(['metadata' => $origin + ['ticket_number' => $ticket->ticket_number]]);
            TicketHistory::create([
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()?->id,
                'action' => 'created',
                'to_status' => $ticket->status,
                'changes' => $origin,
            ]);
            $client->update(['last_interaction_at' => now()]);

            return ['conversation' => $conversation->load('client', 'lastMessage'), 'ticket' => $ticket];
        });

        return response()->json(['success' => true, 'data' => $result], 201);
    }
}
