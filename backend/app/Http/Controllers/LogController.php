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
        $logs = Log::with(['user'])->paginate(20);
        
        // Enhance logs with article titles and user roles
        $logs->getCollection()->transform(function ($log) {
            // Add user role
            if ($log->user) {
                $log->user_role = $log->user->role;
            }
            
            // Add article title if the log is related to an article
            if ($log->model_type === 'App\\Models\\Article' && $log->model_id) {
                $article = \App\Models\Article::find($log->model_id);
                
                if ($article) {
                    // Article still exists
                    $log->article_title = $article->title;
                } else {
                    // Article was deleted or doesn't exist, try to get title from old_values or new_values
                    $oldValues = json_decode($log->old_values, true);
                    $newValues = json_decode($log->new_values, true);
                    
                    // Try old_values first (for delete), then new_values (for create/publish)
                    $log->article_title = $oldValues['title'] ?? $newValues['title'] ?? 'Unknown Article';
                }
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
}
