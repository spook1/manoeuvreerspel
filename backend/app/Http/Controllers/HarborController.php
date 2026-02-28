<?php

namespace App\Http\Controllers;

use App\Models\Harbor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HarborController extends Controller
{
    /**
     * Display a listing of the user's harbors.
     */
    public function index()
    {
        // Haal havens op van de ingelogde gebruiker
        // Optioneel: Ook publieke havens of officiële havens?
        // Voor nu: Alleen eigen havens.
        $harbors = Harbor::where('user_id', Auth::id())
                        ->orderBy('updated_at', 'desc')
                        ->get();

        return response()->json($harbors);
    }

    /**
     * Store a newly created harbor in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'json_data' => 'required|array', // Moet JSON object zijn
            'is_public' => 'boolean',
        ]);

        $harbor = Harbor::create([
            'user_id' => Auth::id(),
            'json_data' => $validated['json_data'],
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return response()->json($harbor, 201);
    }

    /**
     * Display the specified harbor.
     */
    public function show(string $id)
    {
        $harbor = Harbor::findOrFail($id);

        // Check if owner OR public
        if ($harbor->user_id !== Auth::id() && !$harbor->is_public && !$harbor->is_official) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($harbor);
    }

    /**
     * Update the specified harbor in storage.
     */
    public function update(Request $request, string $id)
    {
        $harbor = Harbor::findOrFail($id);

        if ($harbor->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'json_data' => 'required|array',
            'is_public' => 'boolean',
        ]);

        $harbor->update([
            'json_data' => $validated['json_data'],
            'is_public' => $validated['is_public'] ?? $harbor->is_public,
        ]);

        return response()->json($harbor);
    }

    /**
     * Remove the specified harbor from storage.
     */
    public function destroy(string $id)
    {
        $harbor = Harbor::findOrFail($id);

        if ($harbor->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $harbor->delete();

        return response()->json(['message' => 'Harbor deleted']);
    }
}
