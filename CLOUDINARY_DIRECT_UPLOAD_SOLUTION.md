# Solution: Direct Cloudinary Upload from Mobile

## Problem
Network errors when uploading images through backend because:
1. Backend on Render has upload size limits
2. Slow processing causes timeouts
3. Cloudinary configuration issues on Render

## Solution
Upload images DIRECTLY from mobile app to Cloudinary, then send only the URL to backend.

## Steps to Implement

### 1. Create Unsigned Upload Preset in Cloudinary Dashboard

1. Go to https://cloudinary.com/console
2. Login with your account (da9wvkqcl)
3. Go to Settings → Upload
4. Scroll to "Upload presets"
5. Click "Add upload preset"
6. Set:
   - Preset name: `mobile_articles`
   - Signing Mode: **Unsigned**
   - Folder: `articles`
   - Click "Save"

### 2. Update mobile/src/services/cloudinaryService.js

Replace `CLOUDINARY_UPLOAD_PRESET` with your preset name:
```javascript
const CLOUDINARY_UPLOAD_PRESET = 'mobile_articles'; // Your preset name from step 1
```

### 3. Update Backend to Accept Image URL

In `backend/app/Http/Controllers/ArticleController.php`, update the `store` method validation:

```php
$validated = $request->validate([
    'title' => 'required|string|max:255',
    'content' => 'required|string',
    'category_id' => 'required|exists:categories,id',
    'tags' => 'array',
    'tags.*' => 'string',
    'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
    'featured_image_url' => 'nullable|url', // ADD THIS LINE
    'author_name' => 'required|string',
    'status' => 'nullable|in:published,draft',
]);
```

Then in the transaction, update image handling:

```php
$imagePath = null;

// Check if image URL is provided (direct Cloudinary upload)
if ($request->has('featured_image_url') && $request->featured_image_url) {
    $imagePath = $request->featured_image_url;
    Log::info('Using direct Cloudinary URL', ['url' => $imagePath]);
}
// Otherwise try file upload (fallback)
elseif ($request->hasFile('featured_image')) {
    try {
        Log::info('Uploading featured image');
        $imagePath = $this->cloudinaryService->uploadImage($request->file('featured_image'));
        Log::info('Article image uploaded', ['path' => $imagePath]);
    } catch (\Exception $e) {
        Log::error('Image upload failed', ['error' => $e->getMessage()]);
        Log::warning('Continuing article creation without image');
        $imagePath = null;
    }
}
```

### 4. Update CreateArticleScreen.js submitArticle function

Find the section where FormData is created and replace the image handling:

```javascript
// Upload image to Cloudinary first if exists
if (image?.uri) {
  try {
    console.log('Uploading image to Cloudinary...');
    const cloudinaryUrl = await uploadImageToCloudinary(image.uri);
    console.log('Image uploaded successfully:', cloudinaryUrl);
    formData.append('featured_image_url', cloudinaryUrl);
  } catch (uploadError) {
    console.error('Image upload failed:', uploadError);
    const shouldContinue = await new Promise((resolve) => {
      Alert.alert(
        'Image Upload Failed',
        'Failed to upload image. Continue without image?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continue', onPress: () => resolve(true) }
        ]
      );
    });
    if (!shouldContinue) {
      setLoading(false);
      return;
    }
  }
}
```

## Benefits

1. ✅ **No more Network Errors** - Direct upload bypasses backend
2. ✅ **Faster uploads** - No backend processing delay
3. ✅ **No size limits** - Cloudinary handles large files
4. ✅ **Works on Render free tier** - No backend timeout issues
5. ✅ **Automatic optimization** - Cloudinary optimizes images

## Testing

1. Create unsigned upload preset in Cloudinary
2. Update the code as shown above
3. Restart Expo: `npx expo start --clear`
4. Try publishing article with image
5. Check console logs for "Image uploaded successfully"
6. Article should be created with Cloudinary image URL

## Troubleshooting

- **"Upload preset not found"**: Make sure preset is set to "Unsigned" in Cloudinary dashboard
- **"Invalid signature"**: Double-check cloud name is correct (`da9wvkqcl`)
- **Still getting errors**: Check Cloudinary dashboard → Usage to see if you hit limits
