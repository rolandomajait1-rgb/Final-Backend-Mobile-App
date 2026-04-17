<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;

Route::get('/', function () {
    return response()->json(['message' => 'La Verdad Herald API']);
});

// CSRF Cookie endpoint for Sanctum
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Email Verification Pending Page
Route::get('/verification-pending', function () {
    return view('verification-pending');
})->name('verification.pending');

// Article pages with Open Graph meta tags for social sharing
Route::get('/articles/{slug}', [ArticleController::class, 'publicShow'])->name('articles.show');

// Fallback login route for unauthenticated browser requests
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Secure APK Download Route
Route::get('/download-app', function () {
    $apkPath = storage_path('app/releases/LaVerdadHerald.apk');
    
    // Check if the file exists, if not abort with 404
    if (!file_exists($apkPath)) {
        abort(404, 'The application APK is not available for download right now. Please tell the administrator to upload it.');
    }
    
    // Serve the file securely avoiding exposing the direct path, with headers that prevent caching
    return response()->download($apkPath, 'LaVerdadHerald-Latest.apk', [
        'Content-Type' => 'application/vnd.android.package-archive',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
        'Pragma' => 'no-cache',
        'Expires' => '0',
    ]);
})->name('download.apk')->middleware('throttle:10,1'); // Limit to 10 downloads per minute per IP
