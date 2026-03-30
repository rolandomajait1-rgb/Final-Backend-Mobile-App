<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Api\Upload\UploadApi;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected Cloudinary $cloudinary;
    protected UploadApi $uploadApi;

    public function __construct()
    {
        $config = config('filesystems.disks.cloudinary');
        
        Log::info('Cloudinary config', [
            'has_url' => !empty($config['url']),
            'cloud_name' => $config['cloud_name'] ?? 'not set',
            'api_key_set' => !empty($config['api_key']),
        ]);
        
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => $config['cloud_name'] ?? env('CLOUDINARY_CLOUD_NAME'),
                'api_key' => $config['api_key'] ?? env('CLOUDINARY_API_KEY'),
                'api_secret' => $config['api_secret'] ?? env('CLOUDINARY_API_SECRET'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
        
        $this->uploadApi = $this->cloudinary->uploadApi();
    }

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
            $result = $this->uploadApi->upload($file->getRealPath(), [
                'folder' => 'articles',
                'resource_type' => 'auto',
                'quality' => 'auto:good',
                'fetch_format' => 'auto',
            ]);

            if (! $result || ! isset($result['secure_url'])) {
                Log::error('Cloudinary returned empty URL', ['result' => $result]);
                throw new Exception('Cloudinary upload failed: No secure URL returned');
            }

            $secureUrl = $result['secure_url'];

            Log::info('Image uploaded to Cloudinary', [
                'file' => $file->getClientOriginalName(),
                'url' => $secureUrl,
            ]);

            return $secureUrl;
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
        if (! str_contains($imageUrl, 'res.cloudinary.com')) {
            return $imageUrl;
        }

        $parts = explode('/upload/', $imageUrl);
        if (count($parts) !== 2) {
            return $imageUrl;
        }

        $transformation = "w_{$width},h_{$height},c_{$crop},q_auto:good,f_auto";

        return $parts[0].'/upload/'.$transformation.'/'.$parts[1];
    }
}
