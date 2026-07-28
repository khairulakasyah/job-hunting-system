<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ScrapeController;
use App\Http\Controllers\JobTimelineController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/change-password', [AuthController::class, 'changePassword']);

    Route::get('/jobs/stats', [JobController::class, 'stats']);
    Route::apiResource('jobs', JobController::class);

    Route::post('/scrape', [ScrapeController::class, 'scrape']);

    Route::get('/jobs/{job}/timelines', [JobTimelineController::class, 'index']);
    Route::post('/jobs/{job}/timelines/advance', [JobTimelineController::class, 'advance']);
    Route::post('/jobs/{job}/timelines/reset', [JobTimelineController::class, 'reset']);
});