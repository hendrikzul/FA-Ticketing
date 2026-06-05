<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| AICOP API v1
|
*/

// ============================================
// Public routes
// ============================================
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// ============================================
// Authenticated routes
// ============================================
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // TODO: Conversation routes (Sprint 01 - week 2)
    // TODO: Division routes (Sprint 01 - week 2)
    // TODO: Ticket routes (Sprint 02)
});