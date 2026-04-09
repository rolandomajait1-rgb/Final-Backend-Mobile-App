# Article Text Truncation Issue - Debugging Guide

## Problem
Long article content gets cut off when publishing articles.

## Investigation Results

### ✅ Database Schema - CORRECT
- **Content column**: `longText` type (can store up to 4GB)
- **Location**: `backend/database/migrations/2026_03_15_100008_create_articles_table.php`
- **No issues found**

### ✅ Backend Validation - CORRECT
- **Content validation**: `'content' => 'required|string'` (no max length)
- **Location**: `backend/app/Http/Controllers/ArticleController.php`
- **No issues found**

### ✅ Frontend Components - CORRECT
- **RichTextEditor**: No content length limits
- **CreateArticleScreen**: No truncation before submission
- **EditArticleScreen**: No truncation before submission
- **No issues found**

### ⚠️ Fixed Issues
1. **ArticleDetailScreen**: Removed hardcoded `minHeight: 11000` - now flexible

## Debugging Steps Added

### Backend Logging (ArticleController.php)
Added content length logging in:
- `store()` method - logs content length received
- `update()` method - logs content length received
- After article creation - logs both original and saved content length

### Frontend Logging
Added content length logging in:
- `CreateArticleScreen.js` - logs content length before sending
- `EditArticleScreen.js` - logs content length before sending

## How to Debug

### Step 1: Check Frontend Console
When creating/editing an article, check the console for:
```
Content length being sent: [number]
```

### Step 2: Check Backend Logs
After submitting, check Laravel logs for:
```
Article content length received: [number]
Content length saved: [number]
```

### Step 3: Compare Numbers
- If frontend shows large number but backend shows small number → **Network/Server issue**
- If backend receives large number but saves small number → **Database issue**
- If both show same large number → **Display issue** (not truncation)

## Possible Causes & Solutions

### 1. PHP Configuration Limits
Check `php.ini` settings:
```ini
post_max_size = 100M          ; Should be larger than upload_max_filesize
upload_max_filesize = 100M    ; For image uploads
max_input_vars = 10000        ; For form fields
memory_limit = 256M           ; PHP memory
max_execution_time = 300      ; Timeout in seconds
```

### 2. Web Server Limits
**Nginx** (`nginx.conf`):
```nginx
client_max_body_size 100M;
client_body_timeout 300s;
```

**Apache** (`.htaccess`):
```apache
php_value post_max_size 100M
php_value upload_max_filesize 100M
php_value max_execution_time 300
```

### 3. Database Connection Timeout
Check `backend/config/database.php`:
```php
'options' => [
    PDO::ATTR_TIMEOUT => 300,
]
```

### 4. React Native WebView Issue
The HTMLRenderer uses WebView which might have issues with very long HTML.
**Solution**: Check if content displays correctly in browser first.

## Testing Procedure

1. **Create a test article** with very long content (10,000+ words)
2. **Check console logs** for content length
3. **Publish the article**
4. **Check backend logs** in `storage/logs/laravel.log`
5. **View the article** in the app
6. **Compare** what you see vs what you wrote

## Quick Test Query
Run this in your database to check actual content length:
```sql
SELECT id, title, LENGTH(content) as content_length 
FROM articles 
ORDER BY id DESC 
LIMIT 10;
```

## Next Steps

1. Try creating an article with long content
2. Check the logs (frontend console + backend logs)
3. Share the log output to identify where truncation happens
4. Based on logs, we can pinpoint the exact issue

## Files Modified
- ✅ `backend/app/Http/Controllers/ArticleController.php` - Added logging
- ✅ `mobile/src/screens/admin/CreateArticleScreen.js` - Added logging
- ✅ `mobile/src/screens/articles/EditArticleScreen.js` - Added logging
- ✅ `mobile/src/screens/articles/ArticleDetailScreen.js` - Fixed minHeight issue
