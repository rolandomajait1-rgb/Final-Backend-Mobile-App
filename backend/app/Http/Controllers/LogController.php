<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\View\View;

class LogController extends Controller
{
    public function index(): JsonResponse|View
    {
        $logs = Log::with('user')->paginate(20);
        // For API endpoints, default to JSON unless explicitly requesting HTML
        if (request()->wantsJson() || request()->is('api/*')) {
            return response()->json($logs);
        }

        return view('logs.index', compact('logs'));
    }

    public function show(Log $log): JsonResponse|View
    {
        // For API endpoints, default to JSON unless explicitly requesting HTML
        if (request()->wantsJson() || request()->is('api/*')) {
            return response()->json($log);
        }

        return view('logs.show', compact('log'));
    }
}
