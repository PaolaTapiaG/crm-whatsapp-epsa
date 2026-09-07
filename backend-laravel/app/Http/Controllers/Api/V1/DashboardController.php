<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Conversation;
use App\Models\Intent;
use App\Models\Message;
use App\Models\Ticket;
use App\Models\Meter;
use App\Models\Bill;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();

        return response()->json(['success' => true, 'data' => [
            'total_clients' => Client::count(),
            'active_clients' => Client::where('status', 'active')->count(),
            'new_clients_today' => Client::whereDate('created_at', $today)->count(),
            'total_conversations' => Conversation::count(),
            'active_conversations' => Conversation::where('status', 'active')->count(),
            'conversations_today' => Conversation::whereDate('created_at', $today)->count(),
            'total_messages' => Message::count(),
            'messages_today' => Message::whereDate('created_at', $today)->count(),
            'messages_week' => Message::where('created_at', '>=', $weekStart)->count(),
            'total_tickets' => Ticket::count(),
            'open_tickets' => Ticket::where('status', 'open')->count(),
            'resolved_tickets' => Ticket::where('status', 'resolved')->count(),
            'urgent_tickets' => Ticket::where('priority', 'urgent')->where('status', 'open')->count(),
            'total_meters' => Meter::count(),
            'active_meters' => Meter::where('status', 'active')->count(),
            'pending_bills' => Bill::whereIn('status', ['pending', 'overdue'])->count(),
            'outstanding_amount' => round((float) Bill::whereIn('status', ['pending', 'overdue'])->sum('amount'), 2),
            'total_intents' => Intent::count(),
            'active_intents' => Intent::where('is_active', true)->count(),
        ]]);
    }

    public function recentMessages(Request $request)
    {
        $limit = min((int) $request->input('limit', 20), 100);
        $messages = Message::with('conversation.client')->latest()->limit($limit)->get()->map(function ($message) {
            return [
                'id' => $message->id,
                'sender' => $message->sender,
                'text' => str($message->text)->limit(120)->toString(),
                'intent' => $message->intent,
                'confidence' => $message->confidence,
                'client_name' => $message->conversation?->client?->name ?? 'Sin nombre',
                'whatsapp_number' => $message->conversation?->client?->whatsapp_number ?? 'N/A',
                'created_at' => $message->created_at?->diffForHumans(),
            ];
        });

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function topIntents()
    {
        $intents = Message::whereNotNull('intent')
            ->select('intent', DB::raw('COUNT(*) as count'))
            ->groupBy('intent')
            ->orderByDesc('count')
            ->limit(8)
            ->get();

        return response()->json(['success' => true, 'data' => $intents]);
    }

    public function iaStatus()
    {
        $ollama = Http::timeout(2)->get('http://127.0.0.1:11434/api/tags')->successful();

        return response()->json(['success' => true, 'data' => [
            'ollama_status' => $ollama ? 'connected' : 'disconnected',
            'total_messages_analyzed' => Message::whereNotNull('intent')->count(),
            'average_confidence' => round((float) Message::whereNotNull('confidence')->avg('confidence'), 2),
        ]]);
    }
}
