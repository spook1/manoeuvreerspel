<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // Lijst van alle users (Alleen voor admins)
    public function index(Request $request) {
        // Check of user admin is
        if (!$request->user()->isAdmin()) {
            abort(403, 'Alleen admins mogen dit zien.');
        }

        return User::all();
    }

    // Update rol van een user (Alleen voor admins)
    public function updateRole(Request $request, $id) {
        if (!$request->user()->isAdmin()) {
            abort(403);
        }

        $request->validate([
            'role' => 'required|in:user,pro,admin',
        ]);

        $user = User::findOrFail($id);
        $user->role = $request->role;
        $user->save();

        return $user;
    }
}
