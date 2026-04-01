<?php
// routes/api.php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ActivationRequestController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ProjectRequestController;
use Illuminate\Support\Facades\Route;

// ── Health check ──────────────────────────────────────────
Route::get('test', fn() => response()->json([
    'message'   => 'API is working!',
    'timestamp' => now(),
]));

// ── Public auth routes ────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// Email verification link (signed URL, opened in browser)
Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->name('verification.verify')
    ->middleware(['signed', 'throttle:6,1']);

// Public: activation request can be submitted without login
Route::post('activation-requests', [ActivationRequestController::class, 'store']);

// ── Authenticated routes ──────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('logout',       [AuthController::class, 'logout']);
        Route::get('me',            [AuthController::class, 'me']);
        Route::put('profile',       [AuthController::class, 'updateProfile']);
        Route::post('email/resend', [AuthController::class, 'resendVerification'])
            ->middleware('throttle:3,1');
    });

    // ── Customers (all authenticated users) ──────────────
    Route::prefix('customers')->group(function () {
        Route::get('/',               [CustomerController::class, 'index']);
        Route::get('/upcoming',       [CustomerController::class, 'upcoming']);
        Route::post('/generate-code', [CustomerController::class, 'generateCode']);
        Route::post('/',              [CustomerController::class, 'store']);
        Route::get('/{id}',           [CustomerController::class, 'show']);
        Route::put('/{id}',           [CustomerController::class, 'update']);
        Route::delete('/{id}',        [CustomerController::class, 'destroy']);

        // Multiple project meetings endpoints
        Route::post('/{id}/schedule-meeting', [CustomerController::class, 'scheduleMeeting']);
        Route::get('/{id}/project-meetings',  [CustomerController::class, 'getProjectMeetings']);
        Route::put('/{id}/project-meetings/{projectName}', [CustomerController::class, 'updateProjectMeeting']);
        Route::delete('/{id}/project-meetings/{projectName}', [CustomerController::class, 'deleteProjectMeeting']);
    });

    // ── Admin only ────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('stats',          [AdminController::class, 'stats']);
        Route::get('users',          [AdminController::class, 'listUsers']);
        Route::put('users/{id}',     [AdminController::class, 'updateUser']);
        Route::delete('users/{id}',  [AdminController::class, 'deleteUser']);
        Route::get('activation-requests',      [ActivationRequestController::class, 'adminList']);
        Route::get('activation-requests/{id}', [ActivationRequestController::class, 'adminShow']);
        Route::put('activation-requests/{id}', [ActivationRequestController::class, 'adminUpdate']);
        Route::delete('activation-requests/{id}', [ActivationRequestController::class, 'adminDelete']);
    });
    // ── Project Requests ──────────────────────────────────────

    Route::prefix('project-requests')->group(function () {
        Route::post('/', [ProjectRequestController::class, 'store']);
        Route::get('/my-requests', [ProjectRequestController::class, 'myRequests']);
        Route::get('/{id}', [ProjectRequestController::class, 'show']);
    });

    // Admin endpoints for project requests
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('project-requests', [ProjectRequestController::class, 'adminList']);
        Route::put('project-requests/{id}', [ProjectRequestController::class, 'adminUpdate']);
    });
});
