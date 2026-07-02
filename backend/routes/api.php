<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SocialiteController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\DivisionController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TicketCommentController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\KnowledgeController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AccessMatrixController;
use App\Http\Controllers\Api\SkillController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AICOP API Routes v1
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

// OAuth SSO routes (public)
Route::prefix('auth/{provider}')->group(function () {
    Route::get('/redirect', [SocialiteController::class, 'redirect']);
    Route::get('/callback', [SocialiteController::class, 'callback']);
});

// Signed URL routes (no auth header — browser loads directly)
Route::get('/attachments/{attachment}/file', [AttachmentController::class, 'file'])->name('attachments.file');

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/avatar', [AuthController::class, 'uploadAvatar']);
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

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/roles', [UserController::class, 'roles']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::post('/users/{user}/roles', [UserController::class, 'assignRole']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Tickets
    Route::apiResource('tickets', TicketController::class);
    Route::patch('/tickets/{ticket}/status', [TicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket}/comments', [TicketCommentController::class, 'store']);
    Route::post('/tickets/{ticket}/assign', [TicketController::class, 'assign']);

    // Search
    Route::get('/search', [SearchController::class, 'search']);

    // Knowledge Base
    Route::apiResource('knowledge', KnowledgeController::class);
    Route::post('/knowledge/{article}/publish', [KnowledgeController::class, 'publish']);
    Route::post('/tickets/{ticket}/generate-kb', [KnowledgeController::class, 'generateFromTicket']);

    // AI Skills
    Route::get('/skills', [SkillController::class, 'index']);
    Route::post('/skills', [SkillController::class, 'store']);
    Route::put('/skills/{id}', [SkillController::class, 'update']);
    Route::delete('/skills/{id}', [SkillController::class, 'destroy']);
    Route::post('/skills/{id}/toggle', [SkillController::class, 'toggle']);

    // Access Matrix
    Route::get('/access-matrix', [AccessMatrixController::class, 'index']);
    Route::post('/access-matrix', [AccessMatrixController::class, 'store']);
    Route::put('/access-matrix/{id}', [AccessMatrixController::class, 'update']);
    Route::delete('/access-matrix/{id}', [AccessMatrixController::class, 'destroy']);

    // Reports
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/workload', [ReportController::class, 'workload']);
    Route::get('/reports/reminders', [ReportController::class, 'reminders']);
    Route::get('/reports/sla/{ticket}', [ReportController::class, 'sla']);
});
