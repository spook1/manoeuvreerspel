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
        // Eigen havens + alle officiële havens
        $userId = Auth::id();
        $harbors = Harbor::where('user_id', $userId)
                        ->orWhere('is_official', true)
                        ->orderBy('is_official', 'desc')
                        ->orderBy('updated_at', 'desc')
                        ->get();

        return response()->json($harbors);
    }

    /**
     * Get all official harbors (public, no auth required).
     */
    public function official()
    {
        $harbors = Harbor::where('is_official', true)
                        ->with('user:id,name')
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

        $user = Auth::guard('sanctum')->user();
        if (!$harbor->is_public && !$harbor->is_official && (!$user || ($harbor->user_id !== $user->id && $user->role !== 'admin'))) {
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
        $user = Auth::user();

        // Admin mag alle havens bewerken (inclusief official)
        if ($harbor->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'json_data' => 'required|array',
            'is_public' => 'boolean',
            'is_official' => 'boolean',
        ]);

        $updateData = [
            'json_data' => $validated['json_data'],
            'is_public' => $validated['is_public'] ?? $harbor->is_public,
        ];

        // Alleen admin mag is_official wijzigen
        if ($user->role === 'admin' && isset($validated['is_official'])) {
            $updateData['is_official'] = $validated['is_official'];
            // Officiële havens zijn altijd public
            if ($validated['is_official']) {
                $updateData['is_public'] = true;
            }
        }

        $harbor->update($updateData);

        return response()->json($harbor);
    }

    /**
     * Remove the specified harbor from storage.
     */
    public function destroy(string $id)
    {
        $harbor = Harbor::findOrFail($id);

        $user = Auth::user();
        if ($harbor->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $harbor->delete();

        return response()->json(['message' => 'Harbor deleted']);
    }
}
