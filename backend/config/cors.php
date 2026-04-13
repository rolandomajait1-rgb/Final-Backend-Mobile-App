<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines which domains are allowed to access your
    | application's resources from a different domain. You may also
    | configure which HTTP methods and headers are allowed.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_origins' => array_filter([
        'http://localhost:5173',
        'https://official-laverdad-herald.vercel.app',
        env('FRONTEND_URL'),
    ]),

    // Allow preview/deployed Vercel subdomains via pattern
    'allowed_origins_patterns' => [
        '/^https:\/\/official-laverdad-herald.*\.vercel\.app$/',
    ],

    'allowed_methods' => ['*'],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Note: supports_credentials is false because we use Bearer token authentication
    // Bearer tokens are sent via the Authorization header, not cookies
    // Setting this to true would require withCredentials in the frontend, which conflicts with Bearer tokens
    'supports_credentials' => false,

];
