<?php

use Illuminate\Support\Facades\Route;

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

// Fallback login route for unauthenticated browser requests
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');
