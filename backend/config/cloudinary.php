<?php

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key' => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'api_base_url' => env('CLOUDINARY_API_BASE_URL'),
    'timeout' => env('CLOUDINARY_TIMEOUT', 60),
    'secure' => env('CLOUDINARY_SECURE', true),
    
    // Logo URL - Update this after uploading logo to Cloudinary
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
    'logo_url' => env('CLOUDINARY_LOGO_URL', 'https://res.cloudinary.com/' . env('CLOUDINARY_CLOUD_NAME') . '/image/upload/v1/laverdad-herald-logo'),
];
