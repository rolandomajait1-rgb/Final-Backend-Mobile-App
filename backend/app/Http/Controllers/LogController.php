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
                $log->article_title = $article ? $article->title : 'Deleted Article';
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
