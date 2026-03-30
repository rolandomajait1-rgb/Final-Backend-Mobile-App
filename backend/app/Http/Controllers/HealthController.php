<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Health check endpoint for uptime monitoring
     * This prevents Render free tier from spinning down
     */
    public function check(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            
            return response()->json([
                'status' => 'healthy',
                'timestamp' => now()->toIso8601String(),
                'service' => 'Official La Verdad Herald API',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'error' => 'Database connection failed',
                'timestamp' => now()->toIso8601String(),
            ], 503);
        }
    }

    /**
     * Check email configuration (for debugging)
     */
    public function checkConfig(): JsonResponse
    {
        return response()->json([
            'queue_connection' => config('queue.default'),
            'mail_mailer' => config('mail.default'),
            'mail_url_set' => filled(env('MAIL_URL')),
            'mail_host' => config('mail.mailers.smtp.host'),
            'mail_port' => config('mail.mailers.smtp.port'),
            'mail_encryption' => config('mail.mailers.smtp.encryption'),
            'mail_username' => config('mail.mailers.smtp.username'),
            'mail_from' => config('mail.from.address'),
            'app_env' => config('app.env'),
            'cloudinary_configured' => !empty(config('filesystems.disks.cloudinary.url')),
            'cloudinary_cloud_name' => config('filesystems.disks.cloudinary.cloud_name'),
        ]);
    }

    /**
     * Test Cloudinary upload
     */
    public function testCloudinary(): JsonResponse
    {
        try {
            $service = app(CloudinaryService::class);
            
            return response()->json([
                'status' => 'ok',
                'message' => 'CloudinaryService initialized successfully',
                'config' => [
                    'cloud_name' => config('filesystems.disks.cloudinary.cloud_name'),
                    'api_key_set' => !empty(config('filesystems.disks.cloudinary.api_key')),
                    'api_secret_set' => !empty(config('filesystems.disks.cloudinary.api_secret')),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'CloudinaryService initialization failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
