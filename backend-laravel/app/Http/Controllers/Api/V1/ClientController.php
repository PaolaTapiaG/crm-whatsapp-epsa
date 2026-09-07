<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Listar todos los clientes
     */
    public function index(Request $request)
    {
        $query = Client::query();

        // Filtros
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('whatsapp_number', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación
        $perPage = $request->input('per_page', 15);
        $clients = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $clients
        ]);
    }

    /**
     * Crear nuevo cliente
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'whatsapp_number' => 'required|string|unique:clients',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:clients',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'status' => 'nullable|string|in:active,inactive,blocked',
            'metadata' => 'nullable|array',
        ]);

        $client = Client::create($validated);

        return response()->json([
            'success' => true,
            'data' => $client
        ], 201);
    }

    /**
     * Mostrar cliente específico
     */
    public function show($id)
    {
        $client = Client::with(['conversations' => function ($query) {
            $query->orderBy('created_at', 'desc')->limit(5);
        }, 'tickets'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $client
        ]);
    }

    /**
     * Actualizar cliente
     */
    public function update(Request $request, $id)
    {
        $client = Client::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:clients,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'status' => 'nullable|string|in:active,inactive,blocked',
            'metadata' => 'nullable|array',
        ]);

        $client->update($validated);

        return response()->json([
            'success' => true,
            'data' => $client->fresh()
        ]);
    }

    /**
     * Eliminar cliente
     */
    public function destroy($id)
    {
        $client = Client::findOrFail($id);
        $client->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cliente eliminado correctamente'
        ]);
    }

    /**
     * Obtener conversaciones de un cliente
     */
    public function conversations($id)
    {
        $client = Client::findOrFail($id);
        $conversations = $client->conversations()
            ->with('messages')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $conversations
        ]);
    }

    /**
     * Obtener estadísticas de un cliente
     */
    public function stats($id)
    {
        $client = Client::findOrFail($id);

        $stats = [
            'total_conversations' => $client->conversations()->count(),
            'active_conversations' => $client->conversations()->where('status', 'active')->count(),
            'total_messages' => $client->messages()->count(),
            'total_tickets' => $client->tickets()->count(),
            'open_tickets' => $client->tickets()->where('status', 'open')->count(),
            'last_interaction' => $client->last_interaction_at,
            'average_response_time' => $this->calculateAverageResponseTime($client)
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    private function calculateAverageResponseTime($client)
    {
        // Calcular tiempo promedio de respuesta (simplificado)
        $conversations = $client->conversations()->with('messages')->get();
        $totalTime = 0;
        $count = 0;

        foreach ($conversations as $conversation) {
            $messages = $conversation->messages()->orderBy('created_at')->get();
            for ($i = 1; $i < count($messages); $i++) {
                if ($messages[$i-1]->sender === 'user' && $messages[$i]->sender === 'bot') {
                    $totalTime += $messages[$i]->created_at->diffInSeconds($messages[$i-1]->created_at);
                    $count++;
                }
            }
        }

        return $count > 0 ? round($totalTime / $count, 2) : null;
    }
}
