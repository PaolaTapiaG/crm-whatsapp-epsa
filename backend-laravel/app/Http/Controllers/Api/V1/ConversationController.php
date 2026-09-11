<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    /**
     * Listar conversaciones
     */
    public function index(Request $request)
    {
        $query = Conversation::with(['client', 'lastMessage'])
            ->withCount('messages');

        // Filtros
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }

        // Búsqueda
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('client', function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('whatsapp_number', 'LIKE', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'updated_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->input('per_page', 15);
        $conversations = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $conversations
        ]);
    }

    /**
     * Mostrar conversación específica
     */
    public function show($id)
    {
        $conversation = Conversation::with(['client', 'messages', 'tickets'])
            ->withCount('messages')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $conversation
        ]);
    }

    /**
     * Obtener mensajes de una conversación
     */
    public function messages($id)
    {
        $conversation = Conversation::findOrFail($id);
        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $messages
        ]);
    }

    /**
     * Actualizar estado de conversación
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,transferred,finished,closed',
            'priority' => 'nullable|string|in:low,normal,high,urgent',
        ]);

        $conversation = Conversation::findOrFail($id);
        $conversation->update($validated);

        if (in_array($validated['status'], ['finished', 'closed'], true)) {
            $conversation->ended_at = now();
            $conversation->save();
        } elseif ($validated['status'] === 'active') {
            $conversation->ended_at = null;
            $conversation->save();
        }

        return response()->json([
            'success' => true,
            'data' => $conversation->fresh()
        ]);
    }

    /**
     * Transferir conversación a un agente humano
     */
    public function transferToHuman($id)
    {
        $conversation = Conversation::findOrFail($id);
        $conversation->update([
            'status' => 'transferred',
            'priority' => 'high',
            'metadata' => array_merge($conversation->metadata ?? [], [
                'transferred_at' => now(),
                'transferred_reason' => 'manual_transfer'
            ])
        ]);

        // Crear mensaje de sistema
        Message::create([
            'conversation_id' => $conversation->id,
            'sender' => 'system',
            'text' => 'Conversación transferida a un agente humano',
            'metadata' => ['type' => 'transfer']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Conversación transferida a agente humano'
        ]);
    }

    /**
     * Cerrar conversación
     */
    public function close($id)
    {
        $conversation = Conversation::findOrFail($id);
        $conversation->update([
            'status' => 'finished',
            'ended_at' => now()
        ]);

        // Crear mensaje de sistema
        Message::create([
            'conversation_id' => $conversation->id,
            'sender' => 'system',
            'text' => 'Conversación cerrada',
            'metadata' => ['type' => 'close']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Conversación cerrada correctamente'
        ]);
    }

    /**
     * Estadísticas de conversaciones
     */
    public function stats()
    {
        $stats = [
            'total' => Conversation::count(),
            'active' => Conversation::where('status', 'active')->count(),
            'pending' => Conversation::where('status', 'pending')->count(),
            'finished' => Conversation::whereIn('status', ['finished', 'closed'])->count(),
            'transferred' => Conversation::where('status', 'transferred')->count(),
            'high_priority' => Conversation::where('priority', 'high')->count(),
            'urgent' => Conversation::where('priority', 'urgent')->count(),
            'average_duration' => $this->calculateAverageDuration(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    private function calculateAverageDuration()
    {
        $conversations = Conversation::whereNotNull('ended_at')
            ->whereNotNull('started_at')
            ->get();

        if ($conversations->isEmpty()) {
            return null;
        }

        $totalDuration = 0;
        foreach ($conversations as $conversation) {
            $totalDuration += $conversation->ended_at->diffInMinutes($conversation->started_at);
        }

        return round($totalDuration / $conversations->count(), 2);
    }
}
