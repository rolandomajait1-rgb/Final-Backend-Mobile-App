<?php

use App\Http\Controllers\Api\HealthController as ApiHealthController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuthorController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DraftController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\SubscriberController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TeamMemberController;
use App\Http\Controllers\UserController;
use App\Models\Article;
use Illuminate\Support\Facades\Route;

// Health Check Endpoints (for uptime monitoring)
Route::get('/health', [ApiHealthController::class, 'check']);
Route::get('/ping', [ApiHealthController::class, 'ping']);

// Legacy health endpoints (keep for backward compatibility)
Route::get('/config-check', [HealthController::class, 'checkConfig']);
Route::get('/cloudinary-test', [HealthController::class, 'testCloudinary']);

// Team Members Routes
Route::get('/team-members', [TeamMemberController::class, 'index']);

// Public API Routes with Rate Limiting
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/login', [AuthController::class, 'loginApi']);
    Route::post('/register', [AuthController::class, 'registerApi']);
    Route::post('/reset-password', [AuthController::class, 'resetPasswordApi']);
});

// Stricter rate limiting for password reset requests
Route::middleware('throttle:3,1')->post('/forgot-password', [AuthController::class, 'forgotPasswordApi']);
Route::middleware('throttle:5,1')->post('/verify-otp', [AuthController::class, 'verifyOTPApi']);
Route::middleware('throttle:5,1')->post('/verify-registration-otp', [AuthController::class, 'verifyRegistrationOTPApi']);
Route::middleware('throttle:3,1')->post('/resend-registration-otp', [AuthController::class, 'resendRegistrationOTPApi']);

// Email Verification Routes
Route::middleware('throttle:10,1')->get('/email/verify-token', [AuthController::class, 'verifyEmailToken'])->name('verification.verify.token');
Route::middleware('throttle:3,1')->post('/email/resend-verification', [AuthController::class, 'resendVerificationEmail']);

// Contact Form Routes
Route::middleware('throttle:10,1')->post('/contact/feedback', [ContactController::class, 'sendFeedback']);
Route::middleware('throttle:5,1')->post('/contact/request-coverage', [ContactController::class, 'requestCoverage']);
Route::middleware('throttle:5,1')->post('/contact/join-herald', [ContactController::class, 'joinHerald']);
Route::middleware('throttle:10,1')->post('/contact/subscribe', [ContactController::class, 'subscribe']);

// Public unsubscribe endpoint
Route::get('/unsubscribe', [SubscriberController::class, 'unsubscribe']);

// Public Categories with caching
Route::get('/categories', [CategoryController::class, 'index'])->middleware('cache.headers:public;max_age=600');
Route::get('/categories/{category}/articles', [CategoryController::class, 'getArticlesByCategory']);

// Public Articles with caching
Route::get('/articles/public', [ArticleController::class, 'publicIndex'])->middleware('cache.headers:public;max_age=300');
Route::get('/articles/search', [ArticleController::class, 'publicSearch']);
Route::get('/articles/by-slug/{slug}', [ArticleController::class, 'publicBySlug']);
Route::get('/articles/id/{id}', [ArticleController::class, 'publicById']);
Route::get('/articles/author-public/{authorId}', [ArticleController::class, 'getArticlesByAuthorPublic']);
Route::get('/latest-articles', [ArticleController::class, 'latestArticles']);

// Public Authors with pagination
Route::get('/authors', [AuthorController::class, 'publicIndex']);
Route::get('/authors/{authorName}', [AuthorController::class, 'publicAuthorsByName']);

// Public Tags with caching
Route::get('/tags', [TagController::class, 'index'])->middleware('cache.headers:public;max_age=600');
Route::get('/tags/{tag}', [TagController::class, 'show'])->middleware('cache.headers:public;max_age=300');

// Protected Logs (moved to auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/logs', [LogController::class, 'index']);
    Route::get('/logs/{log}', [LogController::class, 'show']);
});

// Protected Article Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'getCurrentUser']);
    Route::put('/user/profile', [UserController::class, 'updateProfileApi']);

    Route::post('/logout', [AuthController::class, 'logoutApi']);
    Route::post('/change-password', [AuthController::class, 'changePasswordApi']);
    Route::post('/delete-account', [AuthController::class, 'deleteAccountApi']);

    Route::get('/user/liked-articles', [ArticleController::class, 'getLikedArticles']);
    Route::get('/user/shared-articles', [ArticleController::class, 'getSharedArticles']);

    Route::get('/articles', [ArticleController::class, 'index']);
    Route::post('/articles', [ArticleController::class, 'store']);
    Route::get('/articles/{article}', [ArticleController::class, 'show']);
    Route::put('/articles/{article}', [ArticleController::class, 'update']);
    Route::delete('/articles/{article}', [ArticleController::class, 'destroy']);
    Route::post('/articles/{article}/like', [ArticleController::class, 'like']);
    Route::get('/articles/author/{authorId}', [ArticleController::class, 'getArticlesByAuthor']);

    // Categories API
    Route::get('/categories/{category}', [CategoryController::class, 'show']);

    // Admin & Moderator Shared Routes
    Route::middleware(['role:admin,moderator'])->group(function () {
        Route::get('/admin/dashboard-stats', [DashboardController::class, 'apiStats']);
        Route::get('/admin/recent-activity', [DashboardController::class, 'apiRecentActivity']);
        Route::get('/admin/audit-logs', [DashboardController::class, 'apiAuditLogs']);
        Route::get('/admin/stats', [DashboardController::class, 'apiAdminFullStats']);

        // Categories API (Write)
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Tags API (Write)
        Route::post('/tags', [TagController::class, 'store']);
        Route::put('/tags/{tag}', [TagController::class, 'update']);
        Route::delete('/tags/{tag}', [TagController::class, 'destroy']);

        // Subscribers API
        Route::apiResource('subscribers', SubscriberController::class);
        Route::post('/subscribers/send-newsletter', [SubscriberController::class, 'sendNewsletter']);

        // Team Members API
        Route::post('/team-members/update', [TeamMemberController::class, 'update']);
    });

    // Admin-Only Routes
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/admin/check-access', [UserController::class, 'checkAdminAccess']);

        Route::get('/admin/moderators', [UserController::class, 'getModerators']);
        Route::post('/admin/moderators', [UserController::class, 'addModerator']);
        Route::delete('/admin/moderators/{id}', [UserController::class, 'removeModerator']);

        Route::apiResource('admin/users', UserController::class);
        Route::apiResource('staff', StaffController::class);
    });

    // Moderator Routes
    Route::middleware(['role:moderator'])->group(function () {
        Route::apiResource('drafts', DraftController::class)->except(['store']);
    });

    // Author Routes
    Route::middleware(['role:author'])->group(function () {
        Route::apiResource('drafts', DraftController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
    });

    // Admin Routes - Full draft access
    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('drafts', DraftController::class);
    });
});
