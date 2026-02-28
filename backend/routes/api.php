<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HarborController;

// Public routes (Iedereen mag dit)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (Alleen ingelogde users met token)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    // Havens opslaan & ophalen
    Route::post('/harbors', [HarborController::class, 'store']);
    Route::get('/harbors', [HarborController::class, 'index']);
});

