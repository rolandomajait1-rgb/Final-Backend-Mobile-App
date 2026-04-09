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
        $totalViews    = (int) \App\Models\Article::sum('view_count');
        $totalUsers    = \App\Models\User::count();
        $totalArticles = \App\Models\Article::count();
        $published     = \App\Models\Article::where('status', 'published')->count();
        $totalLikes    = \App\Models\ArticleInteraction::where('type', 'liked')->count();
        $totalShares   = \App\Models\ArticleInteraction::where('type', 'shared')->count();

        // Simple reader growth: compare this month's vs last month's new users
        $currentReaders  = \App\Models\User::whereMonth('created_at', now()->month)
                                           ->whereYear('created_at', now()->year)->count();
        $previousReaders = \App\Models\User::whereMonth('created_at', now()->subMonth()->month)
                                           ->whereYear('created_at', now()->subMonth()->year)->count();
        $growthPct = $previousReaders > 0
            ? round((($currentReaders - $previousReaders) / $previousReaders) * 100, 2)
            : 0;

        return response()->json([
            // Engagement
            'totalViews'      => $totalViews,
            'totalLikes'      => $totalLikes,
            'totalShares'     => $totalShares,
            'totalArticles'   => $totalArticles,
            'publishedCount'  => $published,

            // Forms (counts from ArticleInteraction or dedicated models if available)
            'feedbackForms'       => \App\Models\ArticleInteraction::where('type', 'feedback')->count(),
            'coverageRequests'    => \App\Models\ArticleInteraction::where('type', 'coverage')->count(),
            'membershipApps'      => $totalUsers, // registered users as membership proxy

            // Reach
            'studentReach'    => $totalUsers,
            'totalUsers'      => $totalUsers,
            'growthPct'       => $growthPct,
            'currentReaders'  => $currentReaders,
            'previousReaders' => $previousReaders,

            // Recent publications
            'recentArticles'  => \App\Models\Article::with('categories')
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
