<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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
        $data = Cache::remember('admin_full_stats', now()->addMinutes(5), function () {
        $totalViews    = (int) \App\Models\Article::sum('view_count');
        $totalUsers    = \App\Models\User::count();
        $totalArticles = \App\Models\Article::count();
        $published     = \App\Models\Article::where('status', 'published')->count();
        $totalLikes    = \App\Models\ArticleInteraction::where('type', 'liked')->count();
        $totalShares   = (int) \App\Models\Article::sum('shares_count');

        // Simple reader growth: compare this month's vs last month's new users
        $lastMonth       = now()->subMonth();
        $currentReaders  = \App\Models\User::whereMonth('created_at', now()->month)
                                           ->whereYear('created_at', now()->year)->count();
        $previousReaders = \App\Models\User::whereMonth('created_at', $lastMonth->month)
                                           ->whereYear('created_at', $lastMonth->year)->count();
        $growthPct = $previousReaders > 0
            ? round((($currentReaders - $previousReaders) / $previousReaders) * 100, 2)
            : 0;

        // Dynamic Chart Data Generation (Cumulative Readership)
        $chart = [
            'monthly' => [
                'labels' => [],
                'data' => [],
            ],
            'yearly' => [
                'labels' => [],
                'data' => [],
            ]
        ];

        // Monthly cumulative data for current year (up to current month)
        $usersBeforeThisYear = \App\Models\User::whereYear('created_at', '<', now()->year)->count();
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Single query with grouping instead of loop (database-agnostic)
        $driver = DB::connection()->getDriverName();
        $monthExpression = $driver === 'pgsql' 
            ? 'EXTRACT(MONTH FROM created_at)' 
            : 'MONTH(created_at)';
        
        $monthlyUsers = \App\Models\User::whereYear('created_at', now()->year)
            ->selectRaw("{$monthExpression} as month, COUNT(*) as count")
            ->groupBy('month')
            ->pluck('count', 'month');

        $cumulative = $usersBeforeThisYear;
        for ($i = 1; $i <= now()->month; $i++) {
            $cumulative += $monthlyUsers[$i] ?? 0;
            $chart['monthly']['labels'][] = $months[$i - 1];
            $chart['monthly']['data'][] = $cumulative;
        }

        // Yearly cumulative data (Last 4 years)
        $currentYear = now()->year;
        for ($y = $currentYear - 3; $y <= $currentYear; $y++) {
            $chart['yearly']['labels'][] = (string) $y;
            $chart['yearly']['data'][] = \App\Models\User::whereYear('created_at', '<=', $y)->count();
        }

        return [
            // Engagement
            'totalViews'      => $totalViews,
            'totalLikes'      => $totalLikes,
            'totalShares'     => $totalShares,
            'totalArticles'   => $totalArticles,
            'publishedCount'  => $published,

            // Forms (counts from ArticleInteraction or dedicated models if available)
            'feedbackForms'       => \App\Models\ContactSubmission::where('type', 'feedback')->count(),
            'coverageRequests'    => \App\Models\ContactSubmission::where('type', 'coverage')->count(),
            'membershipApps'      => \App\Models\ContactSubmission::where('type', 'join_herald')->count(),

            // Reach
            'studentReach'    => $totalUsers,
            'totalUsers'      => $totalUsers,
            'growthPct'       => $growthPct,
            'currentReaders'  => $currentReaders,
            'previousReaders' => $previousReaders,
            'chart'           => $chart,

            // Recent publications
            'recentArticles'  => \App\Models\Article::with('categories')
                ->withCount(['interactions as likes_count' => function ($q) {
                    $q->where('type', 'liked');
                }])
                ->latest('published_at')
                ->take(5)
                ->get()
                ->map(fn ($a) => [
                    'id'           => $a->id,
                    'title'        => $a->title,
                    'author_name'  => $a->author_name ?? $a->display_author_name ?? 'Unknown',
                    'status'       => $a->status,
                    'published_at' => $a->published_at,
                    'likes_count'  => $a->likes_count ?? 0,
                    'views_count'  => $a->view_count ?? 0,
                    'shares_count' => $a->shares_count ?? 0,
                ]),
        ];
        });

        return response()->json($data);
    }


    public function apiRecentActivity(Request $request): JsonResponse
    {
        $logs = \App\Models\Log::with('user')
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        // Pre-fetch all related articles in a single query to prevent N+1 performance issues
        $articleIds = $logs->where('model_type', 'App\\Models\\Article')->pluck('model_id')->filter()->unique();
        $articles = \App\Models\Article::whereIn('id', $articleIds)->pluck('title', 'id');

        $mappedLogs = $logs->map(function ($log) use ($articles) {
                $title = null;
                if ($log->model_type === 'App\\Models\\Article') {
                    $title = $articles->get($log->model_id) 
                        ?? $log->old_values['title'] 
                        ?? $log->new_values['title'] 
                        ?? null;
                }
                return [
                    'action'    => ucfirst($log->action),
                    'title'     => $title ?? ($log->model_type ? class_basename($log->model_type) : 'N/A'),
                    'user'      => $log->user?->email ?? 'Unknown',
                    'timestamp' => $log->created_at->format('n/j/Y g:i A'),
                ];
            });

        return response()->json($mappedLogs);
    }

    public function apiAuditLogs(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->get('per_page', 50), 1), 200);
        $search  = trim($request->get('search', ''));

        $query = \App\Models\Log::with('user')
            ->orderBy('created_at', 'desc');

        if ($search) {
            $driver = DB::connection()->getDriverName();
            $like   = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
            $titleExpressions = match ($driver) {
                'pgsql' => [
                    "old_values->>'title'",
                    "new_values->>'title'",
                ],
                'sqlite' => [
                    "json_extract(old_values, '$.title')",
                    "json_extract(new_values, '$.title')",
                ],
                default => [
                    "JSON_UNQUOTE(JSON_EXTRACT(old_values, '$.title'))",
                    "JSON_UNQUOTE(JSON_EXTRACT(new_values, '$.title'))",
                ],
            };

            [$oldTitleExpression, $newTitleExpression] = $titleExpressions;

            $query->where(function ($q) use ($search, $like, $oldTitleExpression, $newTitleExpression) {
                $q->where('action', $like, "%{$search}%")
                  ->orWhereHas('user', fn ($u) => $u->where('email', $like, "%{$search}%"))
                  ->orWhere(function ($articleQuery) use ($search, $like, $oldTitleExpression, $newTitleExpression) {
                      $articleQuery->where('model_type', \App\Models\Article::class)
                          ->where(function ($titleQuery) use ($search, $like, $oldTitleExpression, $newTitleExpression) {
                              $titleQuery->whereExists(function ($articleTitleQuery) use ($search, $like) {
                                  $articleTitleQuery->selectRaw('1')
                                      ->from('articles')
                                      ->whereColumn('articles.id', 'logs.model_id')
                                      ->where('articles.title', $like, "%{$search}%");
                              })
                              ->orWhereRaw("{$oldTitleExpression} {$like} ?", ["%{$search}%"])
                              ->orWhereRaw("{$newTitleExpression} {$like} ?", ["%{$search}%"]);
                          });
                  });
            });
        }

        $paginatedLogs = $query->paginate($perPage);
        $articleIds = collect($paginatedLogs->items())->where('model_type', 'App\\Models\\Article')->pluck('model_id')->filter()->unique();
        $articles = \App\Models\Article::whereIn('id', $articleIds)->pluck('title', 'id');

        $logs = $paginatedLogs->through(function ($log) use ($articles) {
            $articleTitle = null;
            
            // Try to get article title from multiple sources
            if ($log->model_type === 'App\\Models\\Article') {
                // First try to find the article
                if ($articles->has($log->model_id)) {
                    $articleTitle = $articles[$log->model_id];
                } else {
                    // If article doesn't exist (deleted), try old_values or new_values
                    $articleTitle = $log->old_values['title'] 
                        ?? $log->new_values['title'] 
                        ?? null;
                }
            }
            
            return [
                'id'            => $log->id,
                'action'        => $log->action,
                'article_title' => $articleTitle ? htmlspecialchars($articleTitle, ENT_QUOTES, 'UTF-8') : null,
                'user_email'    => $log->user?->email,
                'created_at'    => $log->created_at,
            ];
        });

        return response()->json($logs);
    }
}
