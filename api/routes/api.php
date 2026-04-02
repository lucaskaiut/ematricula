<?php

use App\Modules\Company\Http\Middlewares\InitializeCompany;
use App\Modules\Person\Http\Controllers\PersonController;
use App\Modules\User\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', InitializeCompany::class])->group(function () {
    Route::get('user/me', [UserController::class, 'me']);
    Route::group(['prefix' => 'persons'], function () {
        Route::get('/', [PersonController::class, 'index']);
        Route::get('/{id}', [PersonController::class, 'show']);
        Route::post('/', [PersonController::class, 'store']);
        Route::put('/{id}', [PersonController::class, 'update']);
        Route::patch('/{id}', [PersonController::class, 'update']);
        Route::delete('/{id}', [PersonController::class, 'destroy']);
    });
    Route::group(['prefix' => 'users'], function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::patch('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
    });
});

Route::post('users/register', [UserController::class, 'register']);
Route::post('users/login', [UserController::class, 'login']);
