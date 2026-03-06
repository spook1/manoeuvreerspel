<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HarborController;
use App\Http\Controllers\ScenarioController;
use App\Http\Controllers\GameController;

// Public routes (Iedereen mag dit)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public: officiële havens zijn voor iedereen beschikbaar
Route::get('/harbors/official', [HarborController::class, 'official']);

// Protected routes (Alleen ingelogde users met token)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    // Havens opslaan & ophalen
    Route::post('/harbors', [HarborController::class, 'store']);
    Route::get('/harbors', [HarborController::class, 'index']);
    Route::get('/harbors/{id}', [HarborController::class, 'show']);
    Route::put('/harbors/{id}', [HarborController::class, 'update']);
    Route::delete('/harbors/{id}', [HarborController::class, 'destroy']);

    // Scenarios opslaan & ophalen
    Route::post('/scenarios', [ScenarioController::class, 'store']);
    Route::get('/scenarios', [ScenarioController::class, 'index']);
    Route::get('/scenarios/{id}', [ScenarioController::class, 'show']);
    Route::put('/scenarios/{id}', [ScenarioController::class, 'update']);
    Route::delete('/scenarios/{id}', [ScenarioController::class, 'destroy']);

    // Games opslaan & ophalen
    Route::post('/games', [GameController::class, 'store']);
    Route::get('/games', [GameController::class, 'index']);
    Route::get('/games/{id}', [GameController::class, 'show']);
    Route::put('/games/{id}', [GameController::class, 'update']);
    Route::delete('/games/{id}', [GameController::class, 'destroy']);
});
