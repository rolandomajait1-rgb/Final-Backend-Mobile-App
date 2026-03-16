<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        $articles = \App\Models\Article::latest()->take(5)->get();

        return view('admin.dashboard', compact('articles'));
    }

    public function apiStats(Request $request): JsonResponse
    {
        return response()->json([
            'users'    => \App\Models\User::count(),
            'articles' => \App\Models\Article::where('status', 'published')->count(),
            'drafts'   => \App\Models\Article::where('status', 'draft')->count(),
            'views'    => \App\Models\ArticleInteraction::where('type', 'shared')->count(),
            'likes'    => \App\Models\ArticleInteraction::where('type', 'liked')->count(),
        ]);
    }

    public function apiAdminFullStats(Request $request): JsonResponse
    {
        return response()->json([
            'totalArticles'  => \App\Models\Article::count(),
            'totalUsers'     => \App\Models\User::count(),
            'totalViews'     => \App\Models\ArticleInteraction::where('type', 'shared')->count(),
            'recentArticles' => \App\Models\Article::with('author.user', 'categories')
                ->latest('published_at')->take(5)->get(),
        ]);
    }

    public function apiRecentActivity(Request $request): JsonResponse
    {
        $activities = [];

        $recentArticles = \App\Models\Article::with('author.user')
            ->where('status', 'published')
            ->latest('published_at')
            ->take(20)
            ->get();

        foreach ($recentArticles as $article) {
            $activities[] = [
                'action' => 'Published',
                'title' => $article->title,
                'user' => $article->author->user->email ?? 'Unknown',
                'timestamp' => $article->published_at->format('n/j/Y g:i A'),
            ];
        }

        return response()->json($activities);
    }

    public function apiAuditLogs(Request $request)
    {
        $logs = \App\Models\Log::with('user')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get()
            ->map(function ($log) {
                return [
                    'action' => $log->action,
                    'article_title' => $log->model_type === 'App\\Models\\Article' ? \App\Models\Article::find($log->model_id)?->title : null,
                    'user_email' => $log->user?->email,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json($logs);
    }
}
