<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Registreren
    public function register(Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'user', // Default rol
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Geregistreerd!',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    // Inloggen
    public function login(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Onjuiste inloggegevens.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Ingelogd!',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    // Uitloggen
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Uitgelogd']);
    }

    // Huidige user info (voor frontend app state)
    public function me(Request $request) {
        return $request->user();
    }
}
