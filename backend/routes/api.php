<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\KnowledgeController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AICOP API Routes v1
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Conversations
    Route::apiResource('conversations', ConversationController::class);
    Route::post('/conversations/{conversation}/participants', [ConversationController::class, 'addParticipant']);
    Route::post('/conversations/{conversation}/watchers', [ConversationController::class, 'addWatcher']);
    Route::delete('/conversations/{conversation}/watchers', [ConversationController::class, 'removeWatcher']);

    // Messages (nested under conversation)
    Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store']);

    // Divisions
    Route::apiResource('divisions', DivisionController::class);
    Route::post('/divisions/{division}/members', [DivisionController::class, 'addMember']);
    Route::delete('/divisions/{division}/members', [DivisionController::class, 'removeMember']);
    Route::get('/divisions/{division}/workload', [DivisionController::class, 'workload']);

    // Tickets
    Route::apiResource('tickets', TicketController::class)->except(['store']);
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign']);

    // Search
    Route::get('/search', [SearchController::class, 'search']);

    // Knowledge Base
    Route::apiResource('knowledge', KnowledgeController::class);
    Route::post('/knowledge/{article}/publish', [KnowledgeController::class, 'publish']);
    Route::post('/tickets/{ticket}/generate-kb', [KnowledgeController::class, 'generateFromTicket']);

    // Reports
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/workload', [ReportController::class, 'workload']);
    Route::get('/reports/reminders', [ReportController::class, 'reminders']);
    Route::get('/reports/sla/{ticket}', [ReportController::class, 'sla']);
});