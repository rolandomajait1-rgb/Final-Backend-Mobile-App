<?php

namespace App\Services;

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    /**
     * Upload an image to Cloudinary with optimization
     *
     * @return string The secure HTTPS URL of the uploaded image
     *
     * @throws Exception
     */
    public function uploadImage(UploadedFile $file): string
    {
        try {
            $result = Cloudinary::upload($file->getRealPath(), [
                'folder' => 'articles',
                'quality' => 'auto:good',
                'fetch_format' => 'auto',
                'width' => 1200,
                'height' => 800,
                'crop' => 'limit',
            ]);

            $uploadedFileUrl = $result->getSecurePath();

            if (! $uploadedFileUrl) {
                Log::error('Cloudinary returned empty URL', ['result' => $result]);
                throw new Exception('Cloudinary upload failed: No secure URL returned');
            }

            Log::info('Image uploaded to Cloudinary', [
                'file' => $file->getClientOriginalName(),
                'url' => $uploadedFileUrl,
            ]);

            return $uploadedFileUrl;
        } catch (Exception $e) {
            Log::error('Cloudinary upload failed', [
                'file' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Get optimized image URL with transformations
     *
     * @param  string  $imageUrl  Original Cloudinary URL
     * @param  int  $width  Desired width
     * @param  int  $height  Desired height
     * @param  string  $crop  Crop mode (fill, fit, limit, etc.)
     * @return string Transformed image URL
     */
    public function getOptimizedUrl(string $imageUrl, int $width = 800, int $height = 600, string $crop = 'fill'): string
    {
        // If not a Cloudinary URL, return as-is
        if (! str_contains($imageUrl, 'res.cloudinary.com')) {
            return $imageUrl;
        }

        // Extract the public ID from the URL
        $parts = explode('/upload/', $imageUrl);
        if (count($parts) !== 2) {
            return $imageUrl;
        }

        // Build transformation string
        $transformation = "w_{$width},h_{$height},c_{$crop},q_auto:good,f_auto";

        // Reconstruct URL with transformations
        return $parts[0].'/upload/'.$transformation.'/'.$parts[1];
    }
}
