<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Harbor;
use App\Models\Scenario;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // Haal alle gebruikers op
    public function users()
    {
        return response()->json(User::withCount('harbors')->get());
    }

    // Update rol van een gebruiker
    public function updateUserRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:student,admin,gamemaster,pro',
        ]);

        $user = User::findOrFail($id);
        $user->role = $request->role;
        $user->save();

        return response()->json(['message' => "User role updated to {$request->role}", 'user' => $user]);
    }

    // Toggle 'Official' status van een haven
    public function toggleOfficialHarbor($id)
    {
        $harbor = Harbor::findOrFail($id);
        $harbor->is_official = !$harbor->is_official;
        // Als het officieel wordt, moet het ook public zijn
        if ($harbor->is_official) {
            $harbor->is_public = true;
        }
        $harbor->save();

        return response()->json(['message' => 'Harbor official status updated', 'harbor' => $harbor]);
    }

    // Toggle 'Official' status van een scenario
    public function toggleOfficialScenario($id)
    {
        $scenario = Scenario::findOrFail($id);
        $scenario->is_official = !$scenario->is_official;
        $scenario->save();

        return response()->json(['message' => 'Scenario official status updated', 'scenario' => $scenario]);
    }

    // Haal alle officiële havens op (publiek endpoint, maar beheerd door admin)
    public function officialHarbors()
    {
        return response()->json(Harbor::where('is_official', true)->with('user:id,name')->get());
    }
}
