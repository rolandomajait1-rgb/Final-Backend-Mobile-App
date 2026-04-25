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
                // First, try to get the article if it still exists
                $article = \App\Models\Article::find($log->model_id);
                
                if ($article) {
                    // Article still exists
                    $log->article_title = $article->title;
                } else {
                    // Article was deleted or doesn't exist
                    // Try to get title from old_values or new_values
                    $oldValues = is_string($log->old_values) ? json_decode($log->old_values, true) : $log->old_values;
                    $newValues = is_string($log->new_values) ? json_decode($log->new_values, true) : $log->new_values;
                    
                    // Try old_values first (for delete/update), then new_values (for create/publish)
                    if (is_array($oldValues) && isset($oldValues['title'])) {
                        $log->article_title = $oldValues['title'];
                    } elseif (is_array($newValues) && isset($newValues['title'])) {
                        $log->article_title = $newValues['title'];
                    } else {
                        $log->article_title = 'Unknown Article';
                    }
                }
            } elseif ($log->model_type === 'App\\Models\\Article') {
                // If there's no model_id but it's an article action, try to get title from values
                $oldValues = is_string($log->old_values) ? json_decode($log->old_values, true) : $log->old_values;
                $newValues = is_string($log->new_values) ? json_decode($log->new_values, true) : $log->new_values;
                
                if (is_array($oldValues) && isset($oldValues['title'])) {
                    $log->article_title = $oldValues['title'];
                } elseif (is_array($newValues) && isset($newValues['title'])) {
                    $log->article_title = $newValues['title'];
                } else {
                    $log->article_title = 'Unknown Article';
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
