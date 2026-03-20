<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\Request;

class GameController extends Controller
{
    public function index(Request $request)
    {
        $games = Game::with('scenarios')->where('user_id', $request->user()->id)->get();
        return response()->json($games);
    }

    public function official()
    {
        $games = Game::with('scenarios')->where('is_official', true)->get();
        return response()->json($games);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
            'start_points' => 'integer|min:0',
            'target_points' => 'integer|min:0',
            'scenario_ids' => 'nullable|array',
            'scenario_ids.*' => 'exists:scenarios,id'
        ]);

        $game = new Game($validated);
        $game->user_id = $request->user()->id;
        $game->save();

        if (isset($validated['scenario_ids'])) {
            $syncData = [];
            foreach ($validated['scenario_ids'] as $index => $id) {
                // we set the pivot "order"
                $syncData[$id] = ['order' => $index + 1];
            }
            $game->scenarios()->sync($syncData);
        }

        return response()->json(['message' => 'Game created', 'game' => $game->load('scenarios')], 201);
    }

    public function show(Request $request, $id)
    {
        $game = Game::with('scenarios')->findOrFail($id);
        
        // Public games can be viewed by anyone, assuming future logic here. 
        // For now, check ownership if not public.
        if (!$game->is_public && $game->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($game);
    }

    public function update(Request $request, $id)
    {
        $game = Game::findOrFail($id);

        if ($game->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
            'start_points' => 'integer|min:0',
            'target_points' => 'integer|min:0',
            'scenario_ids' => 'nullable|array',
            'scenario_ids.*' => 'exists:scenarios,id'
        ]);

        $game->update($validated);

        if (isset($validated['scenario_ids'])) {
            $syncData = [];
            foreach ($validated['scenario_ids'] as $index => $scenId) {
                $syncData[$scenId] = ['order' => $index + 1];
            }
            $game->scenarios()->sync($syncData);
        }

        return response()->json(['message' => 'Game updated', 'game' => $game->load('scenarios')]);
    }

    public function destroy(Request $request, $id)
    {
        $game = Game::findOrFail($id);

        if ($game->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $game->delete();
        return response()->json(['message' => 'Game deleted']);
    }
}
