# Cloudinary Logo Setup for Render Deployment

## Problem
Blade templates were using `asset('images/logo.png')` which relies on local storage. On Render, local storage is ephemeral and gets wiped on each deployment.

## Solution
All Blade templates now use Cloudinary-hosted logo via `config('cloudinary.logo_url')`.

## Setup Instructions

### 1. Upload Logo to Cloudinary

**Option A: Via Cloudinary Dashboard**
1. Go to https://cloudinary.com/console
2. Navigate to Media Library
3. Click "Upload" button
4. Upload `backend/public/images/logo.png`
5. Set the Public ID to: `laverdad-herald-logo`
6. Copy the full URL (should look like: `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/laverdad-herald-logo.png`)

**Option B: Via Artisan Command (if you create one)**
```bash
php artisan cloudinary:upload-logo
```

### 2. Update Environment Variables

Add to your Render environment variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_SECURE=true
```

**Optional:** If you want to override the default logo URL:
```env
CLOUDINARY_LOGO_URL=https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/laverdad-herald-logo.png
```

### 3. Verify Configuration

The logo URL is configured in `config/cloudinary.php`:
```php
'logo_url' => env('CLOUDINARY_LOGO_URL', 'https://res.cloudinary.com/' . env('CLOUDINARY_CLOUD_NAME') . '/image/upload/v1/laverdad-herald-logo'),
```

### 4. Test

After deployment, visit these pages to verify logo appears:
- Article share page: `/articles/{slug}`
- Download page: `/download`

## Files Updated

1. `backend/.env.render.example` - Added Cloudinary config
2. `backend/config/cloudinary.php` - Added logo_url config
3. `backend/resources/views/article-share.blade.php` - Changed to use config
4. `backend/resources/views/articles/show.blade.php` - Changed to use config
5. `backend/resources/views/download-coming-soon.blade.php` - Changed to use config

## Fallback

All images have `onerror="this.style.display='none'"` so if Cloudinary is down or misconfigured, the page will still load (just without the logo).
