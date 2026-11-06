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
            'source' => 'required|in:office,paper,phone,sms',
            'paper_reference' => 'required_if:source,paper|nullable|string|max:120',
            'source_reference' => 'nullable|string|max:120',
            'claim_number' => 'nullable|string|max:120',
            'received_at' => 'nullable|date|before_or_equal:now',
            'service_code' => 'nullable|string|max:80',
            'address' => 'nullable|string|max:500',
            'case_type' => 'required|in:consulta,solicitud,reclamo,emergencia',
            'response_due_at' => 'nullable|date|after:received_at',
            'contact_method' => 'required|in:office,phone,sms,whatsapp',
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:4096',
            'category' => 'required|in:consulta,servicio,queja,reclamo,fuga_casa,rotura_caneria,falta_agua,facturacion,medidor,otro',
            'priority' => 'required|in:low,normal,high,urgent',
        ]);

        if ($data['source'] === 'paper' && empty($data['received_at'])) {
            throw \Illuminate\Validation\ValidationException::withMessages(['received_at' => 'Indica cuándo se recibió el formulario.']);
        }
        if (in_array($data['case_type'], ['reclamo', 'emergencia'], true) && empty($data['response_due_at'])) {
            throw \Illuminate\Validation\ValidationException::withMessages(['response_due_at' => 'Registra la fecha tentativa de respuesta del reclamo.']);
        }

        $result = DB::transaction(function () use ($data, $request): array {
            $client = isset($data['client_id'])
                ? Client::findOrFail($data['client_id'])
                : Client::create([
                    'name' => trim($data['name']),
                    'phone' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                    'whatsapp_number' => null,
                    'status' => 'active',
                ]);
            $receivedAt = $data['received_at'] ?? now()->toIso8601String();
            if (in_array($data['source'], ['phone', 'sms'], true) && !($data['phone'] ?? $client->phone ?? $client->whatsapp_number)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['phone' => 'Registra el número de origen o selecciona un socio con teléfono.']);
            }
            $origin = [
                'source' => $data['source'],
                'received_at' => $receivedAt,
                'paper_reference' => $data['paper_reference'] ?? null,
                'source_reference' => $data['source_reference'] ?? null,
                'claim_number' => $data['claim_number'] ?? null,
                'service_code' => $data['service_code'] ?? null,
                'address' => $data['address'] ?? $client->address,
                'case_type' => $data['case_type'],
                'response_due_at' => $data['response_due_at'] ?? null,
                'contact_method' => $data['contact_method'],
                'registered_by' => $request->user()?->id,
            ];
            $conversation = Conversation::create([
                'client_id' => $client->id,
                'session_id' => 'intake-' . Str::uuid(),
                'channel' => $data['source'],
                'status' => 'active',
                'priority' => $data['case_type'] === 'emergencia' ? 'urgent' : $data['priority'],
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
                'priority' => $data['case_type'] === 'emergencia' ? 'urgent' : $data['priority'],
                'sla_hours' => $data['case_type'] === 'emergencia' ? 24 : 0,
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
