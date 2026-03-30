<?php

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key' => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'api_base_url' => env('CLOUDINARY_API_BASE_URL'),
    'timeout' => env('CLOUDINARY_TIMEOUT', 60),
    'secure' => env('CLOUDINARY_SECURE', true),
];
