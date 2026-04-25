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
    private const ROLE_PLAYER = 'speler';
    private const ROLE_PRO = 'pro';
    private const ROLE_GAMEMASTER = 'gamemaster';
    private const ROLE_ADMIN = 'admin';
    private const ROLE_SUPER_ADMIN = 'super_admin';

    private const MANAGED_ROLES = [
        self::ROLE_PLAYER,
        self::ROLE_PRO,
        self::ROLE_GAMEMASTER,
        self::ROLE_ADMIN,
        self::ROLE_SUPER_ADMIN,
    ];

    private function normalizeRole(string $role): string
    {
        // Keep legacy "admin" input compatible, but store as the preferred super admin role.
        return $role === self::ROLE_ADMIN ? self::ROLE_SUPER_ADMIN : $role;
    }

    private function isAdminRole(?string $role): bool
    {
        return in_array($role, [self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN], true);
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
        return response()->json(
            User::withCount(['harbors', 'scenarios'])
                ->orderByDesc('id')
                ->get()
        );
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

    // Bewerk gebruiker (naam/email/rol + optioneel wachtwoord)
    public function updateUser(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'role' => ['required', 'string', Rule::in(self::MANAGED_ROLES)],
            'password' => 'nullable|string|min:8',
        ]);

        $role = $this->normalizeRole($request->role);
        $user = User::findOrFail($id);

        // Voorkom dat een super admin zichzelf per ongeluk downgrade.
        if ((int) $request->user()->id === (int) $user->id && $role !== self::ROLE_SUPER_ADMIN) {
            return response()->json([
                'message' => 'Je kunt je eigen super admin rol niet verwijderen.',
            ], 422);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $role;
        if ($request->filled('password')) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        try {
            $user->save();
        } catch (QueryException $e) {
            return $this->roleColumnMismatchResponse($e);
        }

        return response()->json(['message' => 'User updated successfully', 'user' => $user]);
    }

    // Update rol van een gebruiker
    public function updateUserRole(Request $request, $id)
    {
        $request->validate([
            'role' => ['required', 'string', Rule::in(self::MANAGED_ROLES)],
        ]);

        $role = $this->normalizeRole($request->role);

        $user = User::findOrFail($id);

        if ((int) $request->user()->id === (int) $user->id && $role !== self::ROLE_SUPER_ADMIN) {
            return response()->json([
                'message' => 'Je kunt je eigen super admin rol niet verwijderen.',
            ], 422);
        }

        $user->role = $role;
        try {
            $user->save();
        } catch (QueryException $e) {
            return $this->roleColumnMismatchResponse($e);
        }

        return response()->json(['message' => "User role updated to {$role}", 'user' => $user]);
    }

    // Verwijder gebruiker
    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'message' => 'Je kunt je eigen account niet verwijderen.',
            ], 422);
        }

        // Houd altijd minimaal 1 admin/super admin account over.
        if ($this->isAdminRole($user->role)) {
            $otherAdminCount = User::whereIn('role', [self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN])
                ->where('id', '!=', $user->id)
                ->count();
            if ($otherAdminCount < 1) {
                return response()->json([
                    'message' => 'Je kunt de laatste admin niet verwijderen.',
                ], 422);
            }
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
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
