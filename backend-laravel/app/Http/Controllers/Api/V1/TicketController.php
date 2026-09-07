<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\TicketHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Ticket::with(['client', 'conversation', 'assignee'])->withCount('comments')->latest();
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority'));
        }
        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->input('assigned_to'));
        }

        return response()->json(['success' => true, 'data' => $query->paginate((int) $request->input('per_page', 20))]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'conversation_id' => 'nullable|exists:conversations,id',
            'meter_id' => 'nullable|exists:meters,id', 'zone_id' => 'nullable|exists:zones,id',
            'subject' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'required|in:rotura_caneria,fuga_casa,falta_agua,facturacion,medidor,servicio,queja,consulta,otro',
            'priority' => 'required|in:low,normal,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'created_by' => 'nullable|exists:users,id',
            'metadata' => 'nullable|array',
        ]);

        $ticket = DB::transaction(function () use ($validated, $request) {
            $ticket = Ticket::create($validated + [
                'status' => isset($validated['assigned_to']) ? 'assigned' : 'open',
                'sla_hours' => $validated['priority'] === 'urgent' ? 4 : 24,
                'created_by' => $validated['created_by'] ?? $request->user()?->id,
            ]);
            $ticket->update(['ticket_number' => $this->ticketNumber($ticket)]);
            $this->recordHistory($ticket, 'created', null, $ticket->status);

            return $ticket;
        });

        return response()->json(['success' => true, 'data' => $ticket->fresh(['client', 'conversation', 'assignee'])], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Ticket::with(['client', 'conversation', 'comments.user', 'history.user'])->findOrFail($id)]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->update($request->validate([
            'subject' => 'sometimes|string|max:255', 'description' => 'nullable|string',
            'category' => 'sometimes|in:rotura_caneria,fuga_casa,falta_agua,facturacion,medidor,servicio,queja,consulta,otro', 'priority' => 'sometimes|in:low,normal,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'metadata' => 'nullable|array',
        ]));
        return response()->json(['success' => true, 'data' => $ticket->fresh(['client', 'assignee'])]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        Ticket::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function updateStatus(Request $request, string $id)
    {
        $ticket = Ticket::findOrFail($id);
        $validated = $request->validate(['status' => 'required|in:open,assigned,in_progress,resolved,closed,cancelled', 'comment' => 'nullable|string']);
        $oldStatus = $ticket->status;
        $newStatus = $validated['status'];
        $ticket->update([
            'status' => $newStatus,
            'resolved_at' => in_array($newStatus, ['resolved', 'closed'], true) ? ($ticket->resolved_at ?? now()) : null,
            'closed_at' => $newStatus === 'closed' ? ($ticket->closed_at ?? now()) : null,
        ]);
        $this->recordHistory($ticket, 'status_changed', $oldStatus, $newStatus);
        if (!empty($validated['comment'])) {
            $this->createComment($ticket, ['comment' => $validated['comment'], 'metadata' => ['status_change' => "{$oldStatus} -> {$newStatus}"]], $request);
        }
        return response()->json(['success' => true, 'data' => $ticket->fresh()]);
    }

    public function assign(Request $request, string $id)
    {
        $ticket = Ticket::findOrFail($id);
        $oldAssignee = $ticket->assigned_to;
        $oldStatus = $ticket->status;
        $ticket->update($request->validate(['assigned_to' => 'required|exists:users,id']) + ['status' => 'assigned']);
        $this->recordHistory($ticket, 'assigned', $oldStatus, 'assigned', ['from_assignee' => $oldAssignee, 'to_assignee' => $ticket->assigned_to]);
        return response()->json(['success' => true, 'data' => $ticket->fresh(['assignee'])]);
    }

    public function addComment(Request $request, string $id)
    {
        $ticket = Ticket::findOrFail($id);
        $comment = $this->createComment($ticket, $request->validate(['comment' => 'required|string', 'is_internal' => 'sometimes|boolean', 'attachments' => 'sometimes|array']), $request);
        $this->recordHistory($ticket, 'commented', $ticket->status, $ticket->status);
        return response()->json(['success' => true, 'data' => $comment], 201);
    }

    private function ticketNumber(Ticket $ticket): string
    {
        return sprintf('TKT-%s-%04d', now()->year, $ticket->id);
    }

    private function createComment(Ticket $ticket, array|string $attributes, Request $request): TicketComment
    {
        if (is_string($attributes)) {
            $attributes = ['comment' => $attributes];
        }

        $attributes['user_id'] = $request->user()?->id;

        return $ticket->comments()->create($attributes);
    }

    private function recordHistory(Ticket $ticket, string $action, ?string $fromStatus, ?string $toStatus, array $changes = []): void
    {
        TicketHistory::create([
            'ticket_id' => $ticket->id,
            'user_id' => request()->user()?->id,
            'action' => $action,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'changes' => $changes,
        ]);
    }
}
