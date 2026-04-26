<?php

namespace App\Http\Controllers;

use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LogController extends Controller
{
    public function index(): JsonResponse|View
    {
        $logs = Log::with(['user'])->paginate(20);
        
        // Pre-fetch articles to prevent N+1 queries
        $articleIds = collect($logs->items())->where('model_type', 'App\\Models\\Article')->pluck('model_id')->filter()->unique();
        $articles = \App\Models\Article::whereIn('id', $articleIds)->pluck('title', 'id');

        // Enhance logs with article titles and user roles
        $logs->getCollection()->transform(function ($log) use ($articles) {
            // Add user role
            if ($log->user) {
                $log->user_role = $log->user->role;
            }
            
            // Add article title if the log is related to an article
            if ($log->model_type === 'App\\Models\\Article') {
                if ($log->model_id && $articles->has($log->model_id)) {
                    $title = $articles[$log->model_id];
                } else {
                    $oldValues = is_string($log->old_values) ? json_decode($log->old_values, true) : $log->old_values;
                    $newValues = is_string($log->new_values) ? json_decode($log->new_values, true) : $log->new_values;
                    
                    if (is_array($oldValues) && isset($oldValues['title'])) {
                        $title = $oldValues['title'];
                    } elseif (is_array($newValues) && isset($newValues['title'])) {
                        $title = $newValues['title'];
                    } else {
                        $title = 'Unknown Article';
                    }
                }
                
                $log->article_title = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
            }
            
            return $log;
        });
        
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

    /**
     * Clear old logs (Admin only)
     */
    public function clearOld(Request $request): JsonResponse
    {
        $days = (int) $request->get('days', 30);
        
        if ($days < 1) {
            return response()->json(['message' => 'Days must be at least 1'], 400);
        }

        $cutoffDate = now()->subDays($days);
        $count = Log::where('created_at', '<', $cutoffDate)->count();

        if ($count === 0) {
            return response()->json([
                'message' => "No logs older than {$days} days found.",
                'deleted' => 0
            ]);
        }

        Log::where('created_at', '<', $cutoffDate)->delete();

        return response()->json([
            'message' => "Successfully deleted {$count} old audit logs.",
            'deleted' => $count,
            'kept_days' => $days
        ]);
    }

    /**
     * Clear all logs (Admin only - use with caution)
     */
    public function clearAll(): JsonResponse
    {
        $count = Log::count();

        if ($count === 0) {
            return response()->json([
                'message' => 'No logs to clear.',
                'deleted' => 0
            ]);
        }

        Log::truncate();

        return response()->json([
            'message' => "Successfully cleared all {$count} audit logs.",
            'deleted' => $count
        ]);
    }
}
