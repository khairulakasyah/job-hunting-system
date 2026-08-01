<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EmailTemplateController;
use App\Http\Controllers\GeneralNoteController;
use App\Http\Controllers\JobAttachmentController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\JobNoteController;
use App\Http\Controllers\NoteCategoryController;
use App\Http\Controllers\ScrapeController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\JobTimelineController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->name('verification.verify')
    ->middleware('signed');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/services', [AdminController::class, 'services']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
        ->middleware('throttle:6,1');

    Route::get('/search', [SearchController::class, 'search']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::post('/jobs/bulk-delete', [JobController::class, 'bulkDelete']);
    Route::patch('/jobs/bulk-status', [JobController::class, 'bulkUpdateStatus']);
    Route::get('/jobs/export', [JobController::class, 'export']);
    Route::get('/jobs/stats', [JobController::class, 'stats']);
    Route::get('/jobs/platforms', [JobController::class, 'platforms']);
    Route::get('/jobs/kanban', [JobController::class, 'kanban']);
    Route::patch('/jobs/{job}/status', [JobController::class, 'updateStatus']);
    Route::apiResource('jobs', JobController::class)->except(['create', 'edit']);

    Route::post('/scrape', [ScrapeController::class, 'scrape']);
    Route::post('/ai/cover-letter', [AiController::class, 'coverLetter']);

    Route::get('/jobs/{job}/timelines', [JobTimelineController::class, 'index']);
    Route::post('/jobs/{job}/timelines/advance', [JobTimelineController::class, 'advance']);
    Route::post('/jobs/{job}/timelines/reset', [JobTimelineController::class, 'reset']);

    Route::get('/calendar/events', [EventController::class, 'index']);
    Route::post('/calendar/events', [EventController::class, 'store']);
    Route::put('/calendar/events/{timeline}', [EventController::class, 'update']);
    Route::delete('/calendar/events/{timeline}', [EventController::class, 'destroy']);

    Route::get('/jobs/{job}/attachments', [JobAttachmentController::class, 'index']);
    Route::post('/jobs/{job}/attachments', [JobAttachmentController::class, 'store']);
    Route::get('/attachments/{attachment}', [JobAttachmentController::class, 'show']);
    Route::delete('/attachments/{attachment}', [JobAttachmentController::class, 'destroy']);

    Route::get('/jobs/{job}/notes', [JobNoteController::class, 'index']);
    Route::post('/jobs/{job}/notes', [JobNoteController::class, 'store']);
    Route::put('/notes/{note}', [JobNoteController::class, 'update']);
    Route::delete('/notes/{note}', [JobNoteController::class, 'destroy']);

    Route::get('/email-templates', [EmailTemplateController::class, 'index']);
    Route::post('/email-templates', [EmailTemplateController::class, 'store']);
    Route::get('/email-templates/{emailTemplate}', [EmailTemplateController::class, 'show']);
    Route::put('/email-templates/{emailTemplate}', [EmailTemplateController::class, 'update']);
    Route::delete('/email-templates/{emailTemplate}', [EmailTemplateController::class, 'destroy']);

    Route::get('/notes/board', [NoteCategoryController::class, 'index']);
    Route::post('/notes/categories', [NoteCategoryController::class, 'store']);
    Route::put('/notes/categories/{noteCategory}', [NoteCategoryController::class, 'update']);
    Route::delete('/notes/categories/{noteCategory}', [NoteCategoryController::class, 'destroy']);
    Route::post('/notes/notes', [GeneralNoteController::class, 'store']);
    Route::put('/notes/notes/{generalNote}', [GeneralNoteController::class, 'update']);
    Route::patch('/notes/notes/{generalNote}/move', [GeneralNoteController::class, 'move']);
    Route::delete('/notes/notes/{generalNote}', [GeneralNoteController::class, 'destroy']);
});
