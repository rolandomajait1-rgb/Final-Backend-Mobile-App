<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'views'    => (int) \App\Models\Article::sum('view_count'),
            'likes'    => \App\Models\ArticleInteraction::where('type', 'liked')->count(),
        ]);
    }

    public function apiAdminFullStats(Request $request): JsonResponse
    {
        return response()->json([
            'totalArticles'  => \App\Models\Article::count(),
            'totalUsers'     => \App\Models\User::count(),
            'totalViews'     => (int) \App\Models\Article::sum('view_count'),
            'recentArticles' => \App\Models\Article::with('categories')
                ->latest('published_at')
                ->take(5)
                ->get()
                ->map(fn ($a) => [
                    'id'           => $a->id,
                    'title'        => $a->title,
                    'author_name'  => $a->author_name ?? $a->display_author_name ?? 'Unknown',
                    'status'       => $a->status,
                    'published_at' => $a->published_at,
                ]),
        ]);
    }


    public function apiRecentActivity(Request $request): JsonResponse
    {
        $logs = \App\Models\Log::with('user')
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->map(function ($log) {
                $title = null;
                if ($log->model_type === 'App\\Models\\Article') {
                    $title = \App\Models\Article::find($log->model_id)?->title
                        ?? ($log->old_values['title'] ?? null);
                }
                return [
                    'action'    => ucfirst($log->action),
                    'title'     => $title ?? ($log->model_type ? class_basename($log->model_type) : 'N/A'),
                    'user'      => $log->user?->email ?? 'Unknown',
                    'timestamp' => $log->created_at->format('n/j/Y g:i A'),
                ];
            });

        return response()->json($logs);
    }

    public function apiAuditLogs(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->get('per_page', 50), 1), 200);
        $search  = trim($request->get('search', ''));

        $query = \App\Models\Log::with('user')
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $driver = DB::connection()->getDriverName();
                $like   = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
                $q->where('action', $like, "%{$search}%")
                  ->orWhereHas('user', fn ($u) => $u->where('email', $like, "%{$search}%"));
            });
        }

        $logs = $query->paginate($perPage)->through(function ($log) {
            return [
                'id'            => $log->id,
                'action'        => $log->action,
                'article_title' => $log->model_type === 'App\\Models\\Article'
                    ? \App\Models\Article::find($log->model_id)?->title
                    : null,
                'user_email'    => $log->user?->email,
                'created_at'    => $log->created_at,
            ];
        });

        return response()->json($logs);
    }
}
