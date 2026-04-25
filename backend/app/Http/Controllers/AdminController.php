<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Harbor;
use App\Models\Scenario;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private const MANAGED_ROLES = [
        User::ROLE_PLAYER,
        User::ROLE_PRO,
        User::ROLE_GAMEMASTER,
        User::ROLE_ADMIN,
        User::ROLE_SUPER_ADMIN,
    ];

    private function normalizeRole(string $role): string
    {
        // Keep legacy "admin" input compatible, but store as the preferred super admin role.
        return $role === User::ROLE_ADMIN ? User::ROLE_SUPER_ADMIN : $role;
    }

    private function roleColumnMismatchResponse(QueryException $e)
    {
        if (str_contains($e->getMessage(), "Data truncated for column 'role'")) {
            return response()->json([
                'message' => "De users.role kolom is verouderd. Draai eerst database migraties: php artisan migrate --force",
            ], 500);
        }

        throw $e;
    }

    // Haal alle gebruikers op
    public function users()
    {
        return response()->json(User::withCount(['harbors', 'scenarios'])->get());
    }

    // Maak een nieuwe gebruiker aan
    public function createUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', 'string', Rule::in(self::MANAGED_ROLES)],
        ]);

        $role = $this->normalizeRole($request->role);

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => \Illuminate\Support\Facades\Hash::make($request->password),
                'role' => $role,
            ]);
        } catch (QueryException $e) {
            return $this->roleColumnMismatchResponse($e);
        }

        return response()->json(['message' => 'User created successfully', 'user' => $user], 201);
    }

    // Update rol van een gebruiker
    public function updateUserRole(Request $request, $id)
    {
        $request->validate([
            'role' => ['required', 'string', Rule::in(self::MANAGED_ROLES)],
        ]);

        $role = $this->normalizeRole($request->role);

        $user = User::findOrFail($id);
        $user->role = $role;
        try {
            $user->save();
        } catch (QueryException $e) {
            return $this->roleColumnMismatchResponse($e);
        }

        return response()->json(['message' => "User role updated to {$role}", 'user' => $user]);
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

    // Toggle 'Official' status van een game
    public function toggleOfficialGame($id)
    {
        $game = \App\Models\Game::findOrFail($id);
        $game->is_official = !$game->is_official;
        if ($game->is_official) {
            $game->is_public = true;
        }
        $game->save();

        return response()->json(['message' => 'Game official status updated', 'game' => $game]);
    }

    // Haal alle officiële havens op (publiek endpoint, maar beheerd door admin)
    public function officialHarbors()
    {
        return response()->json(Harbor::where('is_official', true)->with('user:id,name')->get());
    }
}
