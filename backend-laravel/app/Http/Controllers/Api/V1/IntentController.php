<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Intent;
use Illuminate\Http\Request;

class IntentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return response()->json(['success' => true, 'data' => Intent::query()->orderByDesc('priority')->paginate((int) $request->input('per_page', 50))]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100', 'description' => 'nullable|string',
            'keywords' => 'nullable|array', 'response_template' => 'nullable|string',
            'requires_action' => 'nullable|string', 'priority' => 'nullable|integer', 'is_active' => 'boolean',
        ]);
        return response()->json(['success' => true, 'data' => Intent::create($validated)], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return response()->json(['success' => true, 'data' => Intent::findOrFail($id)]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $intent = Intent::findOrFail($id);
        $intent->update($request->validate(['name' => 'sometimes|string|max:100', 'description' => 'nullable|string', 'keywords' => 'nullable|array', 'response_template' => 'nullable|string', 'requires_action' => 'nullable|string', 'priority' => 'nullable|integer', 'is_active' => 'boolean']));
        return response()->json(['success' => true, 'data' => $intent->fresh()]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        Intent::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
