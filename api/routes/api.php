<?php

use App\Http\Controllers\HealthController;
use App\Modules\Acl\Http\Controllers\AclPermissionController;
use App\Modules\Acl\Http\Controllers\RoleController;
use App\Modules\ClassGroup\Http\Controllers\ClassGroupController;
use App\Modules\Company\Http\Middlewares\InitializeCompany;
use App\Modules\Dashboard\Http\Controllers\DashboardController;
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

Route::get('health', HealthController::class);

Route::middleware(['auth:sanctum', InitializeCompany::class])->group(function () {
    Route::get('user/me', [UserController::class, 'me']);

    Route::middleware('permission:roles.read|roles.write')->group(function () {
        Route::get('acl/permissions', [AclPermissionController::class, 'index']);
    });

    Route::middleware('permission:roles.read')->group(function () {
        Route::get('roles', [RoleController::class, 'index']);
        Route::get('roles/{id}', [RoleController::class, 'show']);
    });
    Route::middleware('permission:roles.write')->group(function () {
        Route::post('roles', [RoleController::class, 'store']);
        Route::put('roles/{id}', [RoleController::class, 'update']);
        Route::patch('roles/{id}', [RoleController::class, 'update']);
        Route::delete('roles/{id}', [RoleController::class, 'destroy']);
    });

    Route::middleware('permission:users.read')->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{id}', [UserController::class, 'show']);
    });
    Route::middleware('permission:users.write')->group(function () {
        Route::post('users', [UserController::class, 'store']);
        Route::put('users/{id}', [UserController::class, 'update']);
        Route::patch('users/{id}', [UserController::class, 'update']);
        Route::delete('users/{id}', [UserController::class, 'destroy']);
    });

    Route::middleware('permission:settings.read')->group(function () {
        Route::get('settings', [TenantSettingsController::class, 'index']);
    });
    Route::middleware('permission:settings.write')->group(function () {
        Route::put('settings', [TenantSettingsController::class, 'update']);
    });

    Route::middleware('permission:modalities.read')->group(function () {
        Route::get('modalities', [ModalityController::class, 'index']);
        Route::get('modalities/{id}', [ModalityController::class, 'show']);
    });
    Route::middleware('permission:modalities.write')->group(function () {
        Route::post('modalities', [ModalityController::class, 'store']);
        Route::put('modalities/{id}', [ModalityController::class, 'update']);
        Route::patch('modalities/{id}', [ModalityController::class, 'update']);
        Route::delete('modalities/{id}', [ModalityController::class, 'destroy']);
    });

    Route::middleware('permission:class_groups.read')->group(function () {
        Route::get('class-groups', [ClassGroupController::class, 'index']);
        Route::get('class-groups/{id}', [ClassGroupController::class, 'show']);
    });
    Route::middleware('permission:class_groups.write')->group(function () {
        Route::post('class-groups', [ClassGroupController::class, 'store']);
        Route::put('class-groups/{id}', [ClassGroupController::class, 'update']);
        Route::patch('class-groups/{id}', [ClassGroupController::class, 'update']);
        Route::delete('class-groups/{id}', [ClassGroupController::class, 'destroy']);
    });

    Route::middleware('permission:enrollments.read')->group(function () {
        Route::get('enrollments', [EnrollmentController::class, 'index']);
        Route::get('enrollments/{id}', [EnrollmentController::class, 'show']);
    });
    Route::middleware('permission:enrollments.write')->group(function () {
        Route::post('enrollments', [EnrollmentController::class, 'store']);
        Route::put('enrollments/{id}', [EnrollmentController::class, 'update']);
        Route::patch('enrollments/{id}', [EnrollmentController::class, 'update']);
        Route::delete('enrollments/{id}', [EnrollmentController::class, 'destroy']);
    });

    Route::middleware('permission:plans.read')->group(function () {
        Route::get('plans', [PlanController::class, 'index']);
        Route::get('plans/{id}', [PlanController::class, 'show']);
    });
    Route::middleware('permission:plans.write')->group(function () {
        Route::post('plans', [PlanController::class, 'store']);
        Route::put('plans/{id}', [PlanController::class, 'update']);
        Route::patch('plans/{id}', [PlanController::class, 'update']);
        Route::delete('plans/{id}', [PlanController::class, 'destroy']);
    });

    Route::middleware('permission:subscriptions.read')->group(function () {
        Route::get('subscriptions', [SubscriptionController::class, 'index']);
        Route::get('subscriptions/{id}', [SubscriptionController::class, 'show']);
    });
    Route::middleware('permission:subscriptions.write')->group(function () {
        Route::post('subscriptions/{id}/generate-next-invoice', [SubscriptionController::class, 'generateNextInvoice']);
        Route::put('subscriptions/{id}', [SubscriptionController::class, 'update']);
        Route::patch('subscriptions/{id}', [SubscriptionController::class, 'update']);
    });

    Route::middleware('permission:invoices.read')->group(function () {
        Route::get('invoices', [InvoiceController::class, 'index']);
        Route::get('invoices/{id}', [InvoiceController::class, 'show']);
    });
    Route::middleware('permission:invoices.write')->group(function () {
        Route::post('invoices/{invoice}/payments', [PaymentController::class, 'store']);
        Route::put('invoices/{id}', [InvoiceController::class, 'update']);
        Route::patch('invoices/{id}', [InvoiceController::class, 'update']);
    });

    Route::middleware('permission:payments.sync')->group(function () {
        Route::post('payments/{payment}/sync-status', [PaymentController::class, 'syncStatus']);
    });

    Route::middleware('permission:dashboard.access')->group(function () {
        Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    });

    Route::middleware('permission:persons.read')->group(function () {
        Route::get('persons', [PersonController::class, 'index']);
        Route::get('persons/{id}', [PersonController::class, 'show']);
    });
    Route::middleware('permission:persons.write')->group(function () {
        Route::post('persons', [PersonController::class, 'store']);
        Route::put('persons/{id}', [PersonController::class, 'update']);
        Route::patch('persons/{id}', [PersonController::class, 'update']);
        Route::delete('persons/{id}', [PersonController::class, 'destroy']);
    });
});

Route::post('users/register', [UserController::class, 'register']);
Route::post('users/login', [UserController::class, 'login']);
