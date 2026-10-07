<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Events\MessageDeleted;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Message::query()->with('conversation');
        if ($request->filled('conversation_id')) $query->where('conversation_id', $request->conversation_id);
        if ($request->boolean('internal')) $query->internal();
        return response()->json(['success' => true, 'data' => $query->latest()->paginate(50)]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'content' => 'required|string|max:4096',
            'internal' => 'sometimes|boolean',
        ]);
        $message = Message::create([
            'conversation_id' => $data['conversation_id'],
            'sender' => $data['internal'] ?? false ? 'human' : 'system',
            'sender_type' => $data['internal'] ?? false ? 'operator' : 'system',
            'text' => $data['content'],
            'content' => $data['content'],
            'internal' => $data['internal'] ?? false,
        ]);
        return response()->json(['success' => true, 'data' => $message], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Message::findOrFail($id)]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $message = Message::findOrFail($id);
        $data = $request->validate(['content' => 'required|string|max:4096']);
        $message->update(['content' => $data['content'], 'text' => $data['content']]);
        return response()->json(['success' => true, 'data' => $message->fresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $message = Message::findOrFail($id);
        $message->update(['deleted_by' => $request->user()?->id]);
        $message->delete();

        try {
            MessageDeleted::dispatch($message);
        } catch (\Throwable $exception) {
            report($exception);
        }

        return response()->json(['success' => true, 'data' => [
            'id' => $message->id,
            'deleted_at' => $message->deleted_at?->toISOString(),
        ]]);
    }
}
