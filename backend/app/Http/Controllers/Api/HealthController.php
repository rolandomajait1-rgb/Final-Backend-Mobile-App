<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $health = [
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'services' => []
        ];

        try {
            DB::connection()->getPdo();
            $health['services']['database'] = [
                'status' => 'connected',
                'driver' => config('database.default')
            ];
        } catch (\Exception $e) {
            $health['status'] = 'unhealthy';
            $health['services']['database'] = [
                'status' => 'disconnected',
                'error' => $e->getMessage()
            ];
        }

        $health['services']['cloudinary'] = [
            'status' => config('cloudinary.cloud_name') ? 'configured' : 'not_configured'
        ];

        $statusCode = $health['status'] === 'healthy' ? 200 : 503;
        return response()->json($health, $statusCode);
    }

    public function ping(): JsonResponse
    {
        return response()->json(['message' => 'pong', 'timestamp' => now()->toIso8601String()]);
    }
}
