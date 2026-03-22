<?php

namespace App\Http\Controllers;

use App\Models\Scenario;
use Illuminate\Http\Request;

class ScenarioController extends Controller
{
    public function index(Request $request)
    {
        // Return only scenarios created by the user
        $scenarios = Scenario::where('user_id', $request->user()->id)->with('harbor:id,is_official')->get();
        return response()->json($scenarios);
    }

    public function official()
    {
        $scenarios = Scenario::where('is_official', true)->with(['user:id,name', 'harbor:id,is_official'])->get();
        return response()->json($scenarios);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'harbor_id' => 'required|exists:harbors,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'points' => 'integer',
            'time_limit' => 'nullable|integer',
            'json_data' => 'nullable|array'
        ]);

        $scenario = new Scenario($validated);
        $scenario->user_id = $request->user()->id;
        $scenario->save();

        return response()->json(['message' => 'Scenario created', 'scenario' => $scenario], 201);
    }

    public function show(Request $request, $id)
    {
        $scenario = Scenario::findOrFail($id);
        
        $user = $request->user();
        if ($scenario->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($scenario);
    }

    public function update(Request $request, $id)
    {
        $scenario = Scenario::findOrFail($id);

        $user = $request->user();
        if ($scenario->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'harbor_id' => 'exists:harbors,id',
            'name' => 'string|max:255',
            'description' => 'nullable|string',
            'points' => 'integer',
            'time_limit' => 'nullable|integer',
            'json_data' => 'nullable|array'
        ]);

        $scenario->update($validated);

        return response()->json(['message' => 'Scenario updated', 'scenario' => $scenario]);
    }

    public function destroy(Request $request, $id)
    {
        $scenario = Scenario::findOrFail($id);

        $user = $request->user();
        if ($scenario->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $scenario->delete();
        return response()->json(['message' => 'Scenario deleted']);
    }
}
