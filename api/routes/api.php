<?php

use App\Modules\ClassGroup\Http\Controllers\ClassGroupController;
use App\Modules\Company\Http\Middlewares\InitializeCompany;
use App\Modules\Enrollment\Http\Controllers\EnrollmentController;
use App\Modules\Invoice\Http\Controllers\InvoiceController;
use App\Modules\Modality\Http\Controllers\ModalityController;
use App\Modules\Payment\Http\Controllers\PaymentController;
use App\Modules\Person\Http\Controllers\PersonController;
use App\Modules\Plan\Http\Controllers\PlanController;
use App\Modules\Setting\Http\Controllers\TenantSettingsController;
use App\Modules\Subscription\Http\Controllers\SubscriptionController;
use App\Modules\User\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', InitializeCompany::class])->group(function () {
    Route::get('user/me', [UserController::class, 'me']);
    Route::group(['prefix' => 'modalities'], function () {
        Route::get('/', [ModalityController::class, 'index']);
        Route::get('/{id}', [ModalityController::class, 'show']);
        Route::post('/', [ModalityController::class, 'store']);
        Route::put('/{id}', [ModalityController::class, 'update']);
        Route::patch('/{id}', [ModalityController::class, 'update']);
        Route::delete('/{id}', [ModalityController::class, 'destroy']);
    });
    Route::group(['prefix' => 'class-groups'], function () {
        Route::get('/', [ClassGroupController::class, 'index']);
        Route::get('/{id}', [ClassGroupController::class, 'show']);
        Route::post('/', [ClassGroupController::class, 'store']);
        Route::put('/{id}', [ClassGroupController::class, 'update']);
        Route::patch('/{id}', [ClassGroupController::class, 'update']);
        Route::delete('/{id}', [ClassGroupController::class, 'destroy']);
    });
    Route::group(['prefix' => 'enrollments'], function () {
        Route::get('/', [EnrollmentController::class, 'index']);
        Route::get('/{id}', [EnrollmentController::class, 'show']);
        Route::post('/', [EnrollmentController::class, 'store']);
        Route::put('/{id}', [EnrollmentController::class, 'update']);
        Route::patch('/{id}', [EnrollmentController::class, 'update']);
        Route::delete('/{id}', [EnrollmentController::class, 'destroy']);
    });
    Route::group(['prefix' => 'plans'], function () {
        Route::get('/', [PlanController::class, 'index']);
        Route::get('/{id}', [PlanController::class, 'show']);
        Route::post('/', [PlanController::class, 'store']);
        Route::put('/{id}', [PlanController::class, 'update']);
        Route::patch('/{id}', [PlanController::class, 'update']);
        Route::delete('/{id}', [PlanController::class, 'destroy']);
    });
    Route::group(['prefix' => 'subscriptions'], function () {
        Route::get('/', [SubscriptionController::class, 'index']);
        Route::post('/{id}/generate-next-invoice', [SubscriptionController::class, 'generateNextInvoice']);
        Route::get('/{id}', [SubscriptionController::class, 'show']);
        Route::put('/{id}', [SubscriptionController::class, 'update']);
        Route::patch('/{id}', [SubscriptionController::class, 'update']);
    });
    Route::group(['prefix' => 'invoices'], function () {
        Route::get('/', [InvoiceController::class, 'index']);
        Route::get('/{id}', [InvoiceController::class, 'show']);
        Route::post('/{invoice}/payments', [PaymentController::class, 'store']);
        Route::put('/{id}', [InvoiceController::class, 'update']);
        Route::patch('/{id}', [InvoiceController::class, 'update']);
    });
    Route::post('payments/{payment}/sync-status', [PaymentController::class, 'syncStatus']);
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
    Route::group(['prefix' => 'settings'], function () {
        Route::get('/', [TenantSettingsController::class, 'index']);
        Route::put('/', [TenantSettingsController::class, 'update']);
    });
});

Route::post('users/register', [UserController::class, 'register']);
Route::post('users/login', [UserController::class, 'login']);
