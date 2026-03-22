<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HarborController;
use App\Http\Controllers\ScenarioController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\AdminController;

// Public routes (Iedereen mag dit)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public: officiële havens zijn voor iedereen beschikbaar
// Public: officiële havens en scnario's zijn voor iedereen beschikbaar
Route::get('/harbors/official', [HarborController::class, 'official']);
Route::get('/scenarios/official', [ScenarioController::class, 'official']);
Route::get('/games/official', [GameController::class, 'official']);
// Public: individuele items ophalen
Route::get('/harbors/{id}', [HarborController::class, 'show']);
Route::get('/scenarios/{id}', [ScenarioController::class, 'show']);
Route::get('/games/{id}', [GameController::class, 'show']);

// Protected routes (Alleen ingelogde users met token)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    
    // Havens opslaan & ophalen
    Route::post('/harbors', [HarborController::class, 'store']);
    Route::get('/harbors', [HarborController::class, 'index']);
    Route::put('/harbors/{id}', [HarborController::class, 'update']);
    Route::delete('/harbors/{id}', [HarborController::class, 'destroy']);

    // Scenarios opslaan & ophalen
    Route::post('/scenarios', [ScenarioController::class, 'store']);
    Route::get('/scenarios', [ScenarioController::class, 'index']);
    Route::put('/scenarios/{id}', [ScenarioController::class, 'update']);
    Route::delete('/scenarios/{id}', [ScenarioController::class, 'destroy']);

    // Games opslaan & ophalen
    Route::post('/games', [GameController::class, 'store']);
    Route::get('/games', [GameController::class, 'index']);
    Route::put('/games/{id}', [GameController::class, 'update']);
    Route::delete('/games/{id}', [GameController::class, 'destroy']);

    // Admin routes
    Route::post('/admin/harbors/{id}/toggle-official', [AdminController::class, 'toggleOfficialHarbor']);
    Route::post('/admin/scenarios/{id}/toggle-official', [AdminController::class, 'toggleOfficialScenario']);
    Route::post('/admin/games/{id}/toggle-official', [AdminController::class, 'toggleOfficialGame']);
});
