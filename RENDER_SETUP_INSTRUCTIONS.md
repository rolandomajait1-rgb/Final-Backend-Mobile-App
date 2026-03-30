# Render Deployment Setup Instructions

## Step 1: Add Environment Variables to Render Dashboard

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click on "Environment" in the left sidebar
4. Add these environment variables:

```
CLOUDINARY_URL=cloudinary://285943431969867:dNVfw5QXSoDwLksOCfOchFcAWV8@da9wvkqcl
CLOUDINARY_API_KEY=285943431969867
CLOUDINARY_API_SECRET=dNVfw5QXSoDwLksOCfOchFcAWV8
CLOUDINARY_CLOUD_NAME=da9wvkqcl
```

## Step 2: Update Build Command (Optional)

If you want to use the custom php.ini file:

1. In Render Dashboard → Your Service → Settings
2. Update "Build Command" to:
```bash
composer install --no-dev --optimize-autoloader && cp php.ini /opt/render/project/src/php.ini
```

3. Add environment variable:
```
PHP_INI_SCAN_DIR=/opt/render/project/src
```

## Step 3: Commit and Push Changes

```bash
cd backend
git add php.ini render.yaml
git commit -m "Add Render configuration for image uploads"
git push origin main
```

## Step 4: Check Render Logs

After deployment:
1. Go to Render Dashboard → Your Service → Logs
2. Try publishing an article with image from mobile app
3. Watch the logs for any errors

## Common Errors and Solutions

### "Must supply api_key"
- Missing CLOUDINARY_API_KEY in Render environment variables

### "PostTooLargeException"
- PHP upload limits too low
- Make sure php.ini is being loaded (check logs for "Loaded Configuration File")

### "Network Error" from mobile
- Backend is sleeping (cold start)
- Wait for green "Connected" indicator before publishing

### "Server Error 500"
- Check Render logs for exact error
- Usually Cloudinary configuration issue

## Testing

1. Make sure backend shows "Connected" (green) in mobile app
2. Try publishing article WITHOUT image first
3. If that works, try WITH compressed image (should be < 2MB)
4. Check Render logs for any errors
