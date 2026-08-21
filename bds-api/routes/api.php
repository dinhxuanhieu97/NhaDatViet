<?php

use App\Http\Controllers\Api\V1\Admin\ModerationController;
use App\Http\Controllers\Api\V1\Admin\StatsController;
use App\Http\Controllers\Api\V1\Admin\UserManagementController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\LocationController;
use App\Http\Controllers\Api\V1\MyPropertyController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\PropertyController;
use App\Http\Controllers\Api\V1\PropertyImageController;
use App\Http\Controllers\Api\V1\SocialAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Công khai — không cần đăng nhập
    |--------------------------------------------------------------------------
    */
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,60');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,60');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,60');

    // Đăng nhập Google/Facebook — luồng redirect trình duyệt thật (không phải
    // gọi API JSON), xem SocialAuthController để biết chi tiết + cách cấu hình.
    Route::middleware('throttle:20,1')->group(function () {
        Route::get('auth/social/{provider}/redirect', [SocialAuthController::class, 'redirect']);
        Route::get('auth/social/{provider}/callback', [SocialAuthController::class, 'callback']);
    });

    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{category}', [CategoryController::class, 'show']);

    Route::get('provinces', [LocationController::class, 'provinces']);
    Route::get('provinces/{province}/districts', [LocationController::class, 'districts']);
    Route::get('districts/{district}/wards', [LocationController::class, 'wards']);

    Route::get('projects', [ProjectController::class, 'index']);
    Route::get('projects/{project}', [ProjectController::class, 'show']);

    Route::middleware('throttle:60,1')->group(function () {
        Route::get('properties', [PropertyController::class, 'index']);
        Route::get('properties/map', [PropertyController::class, 'map']);
        Route::get('properties/{slug}', [PropertyController::class, 'show']);
        Route::get('properties/{slug}/similar', [PropertyController::class, 'similar']);
        Route::get('properties/{slug}/reveal-phone', [PropertyController::class, 'revealPhone'])
            ->middleware('throttle:20,60');
        Route::post('properties/{slug}/contact', [PropertyController::class, 'contact'])
            ->middleware('throttle:10,60');
        Route::post('properties/{slug}/report', [PropertyController::class, 'report'])
            ->middleware('throttle:10,60');
    });

    /*
    |--------------------------------------------------------------------------
    | Cần đăng nhập
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'active'])->group(function () {

        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/password', [AuthController::class, 'updatePassword']);

        // Tin đăng của tôi
        Route::prefix('my')->group(function () {
            Route::get('properties', [MyPropertyController::class, 'index']);
            Route::post('properties', [MyPropertyController::class, 'store'])
                ->middleware('throttle:10,1440'); // 10 tin / ngày
            Route::get('properties/{property:id}', [MyPropertyController::class, 'show']);
            Route::put('properties/{property:id}', [MyPropertyController::class, 'update']);
            Route::delete('properties/{property:id}', [MyPropertyController::class, 'destroy']);
            Route::post('properties/{property:id}/submit', [MyPropertyController::class, 'submit']);
            Route::post('properties/{property:id}/toggle-visibility', [MyPropertyController::class, 'toggleVisibility']);

            // Ảnh của tin đăng
            Route::post('properties/{property:id}/images', [PropertyImageController::class, 'store']);
            Route::delete('properties/{property:id}/images/{image}', [PropertyImageController::class, 'destroy']);
            Route::put('properties/{property:id}/images/order', [PropertyImageController::class, 'reorder']);

            // Tin yêu thích
            Route::get('favorites', [FavoriteController::class, 'index']);
            Route::post('favorites/{property:id}', [FavoriteController::class, 'store']);
            Route::delete('favorites/{property:id}', [FavoriteController::class, 'destroy']);
        });

        /*
        |----------------------------------------------------------------------
        | Kiểm duyệt & Quản trị
        |----------------------------------------------------------------------
        */
        Route::prefix('admin')->group(function () {
            // Kiểm duyệt tin — moderator + admin
            Route::middleware('permission:property.moderate')->group(function () {
                Route::get('properties', [ModerationController::class, 'index']);
                Route::post('properties/{property:id}/approve', [ModerationController::class, 'approve']);
                Route::post('properties/{property:id}/reject', [ModerationController::class, 'reject']);
                Route::post('reports/{report}/handle', [StatsController::class, 'handleReport']);
            });

            Route::delete('properties/{property:id}', [ModerationController::class, 'destroy'])
                ->middleware('permission:property.delete.any');

            // Thống kê & báo cáo
            Route::middleware('permission:report.view')->group(function () {
                Route::get('stats', [StatsController::class, 'index']);
                Route::get('reports', [StatsController::class, 'reports']);
            });

            // Quản lý người dùng
            Route::get('users', [UserManagementController::class, 'index'])
                ->middleware('permission:user.viewAny');
            Route::get('users/{user}', [UserManagementController::class, 'show'])
                ->middleware('permission:user.view');
            Route::put('users/{user}', [UserManagementController::class, 'update'])
                ->middleware('permission:user.update');
            Route::post('users/{user}/roles', [UserManagementController::class, 'assignRoles'])
                ->middleware('permission:user.assignRole');
            Route::delete('users/{user}', [UserManagementController::class, 'destroy'])
                ->middleware('permission:user.delete');
        });
    });
});
