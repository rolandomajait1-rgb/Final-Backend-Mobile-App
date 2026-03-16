<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\ArticleInteraction;
use App\Models\Author;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\View\View;

class ArticleController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    public function index(Request $request): JsonResponse|View
    {
        $query = Article::with('author.user', 'categories', 'tags')
            ->withCount(['interactions as likes_count' => function ($query) {
                $query->where('type', 'liked');
            }])
            ->withExists(['interactions as is_liked' => function ($query) {
                $query->where('user_id', Auth::id())->where('type', 'liked');
            }]);

        // Filter by status if provided
        if ($request->has('status') && $request->status) {
            // Require authentication for draft articles
            if ($request->status === 'draft') {
                $user = Auth::user();
                if (! $user || ! $user->isAdmin()) {
                    return response()->json(['error' => 'Admin access required for drafts'], 403);
                }
            }
            $query->where('status', $request->status);
        } else {
            $query->published();
        }

        $query->latest($request->status === 'draft' ? 'created_at' : 'published_at');

        // Filter by category if provided
        if ($request->has('category') && $request->category) {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('name', 'ILIKE', $request->category);
            });
        }

        // Filter by limit if provided - max 100 to prevent DoS
        $limit = min(max((int) $request->get('limit', 10), 1), 100);
        $articles = $query->paginate($limit);

        if (request()->wantsJson()) {
            return response()->json($articles);
        }

        return view('articles.index', compact('articles'));
    }

    public function publicIndex(Request $request): JsonResponse
    {
        // Validate and limit pagination parameters
        $limit = min(max((int) $request->get('limit', 10), 1), 100);

        $articles = Article::published()
            ->with('author.user', 'categories', 'tags')
            ->withCount(['interactions as likes_count' => function ($query) {
                $query->where('type', 'liked');
            }])
            ->latest('published_at')
            ->paginate($limit);

        return response()->json($articles);
    }

    public function publicSearch(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 20)));

        $query = trim($query);
        $query = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $query);

        if (strlen($query) < 3) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'per_page' => $perPage,
                    'total' => 0,
                    'last_page' => 1,
                ],
            ]);
        }

        if (strlen($query) > 100) {
            return response()->json(['message' => 'Search query too long'], 400);
        }

        $articles = Article::published()
            ->with('author.user', 'categories')
            ->where(function ($q) use ($query) {
                $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
                $like = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
                $q->where('title', $like, "%{$query}%")
                    ->orWhere('excerpt', $like, "%{$query}%")
                    ->orWhere('content', $like, "%{$query}%");
            })
            ->latest('published_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $articles->items(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
                'last_page' => $articles->lastPage(),
            ],
        ]);
    }

    public function publicBySlug($slug): JsonResponse
    {
        $article = Article::published()
            ->with('author.user', 'categories', 'tags')
            ->where('slug', $slug)
            ->firstOrFail();

        // Increment view count
        $article->increment('view_count');

        // Load like counts
        $article->loadCount(['interactions as likes_count' => function ($query) {
            $query->where('type', 'liked');
        }]);

        return response()->json($article);
    }

    public function publicById($id): JsonResponse
    {
        $article = Article::with('author.user', 'categories', 'tags')->find($id);
        if (! $article) {
            return response()->json(['message' => 'Article not found'], 404);
        }

        // Increment view count
        $article->increment('view_count');

        // Load like counts
        $article->loadCount(['interactions as likes_count' => function ($query) {
            $query->where('type', 'liked');
        }]);

        return response()->json($article);
    }

    public function latestArticles(): JsonResponse
    {
        // Use a new cache key to avoid pulling the old bloated cache from the database
        $articles = \Illuminate\Support\Facades\Cache::remember('latest_articles_optimized', 300, function () {
            return Article::published()
                ->select('id', 'title', 'slug', 'excerpt', 'featured_image', 'published_at', 'author_id')
                ->with('author.user', 'categories')
                ->latest('published_at')
                ->take(6)
                ->get();
        });

        return response()->json($articles);
    }

    public function create(): View
    {
        $categories = Category::all();
        $tags = Tag::all();

        return view('articles.create', compact('categories', 'tags'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'tags' => 'array',
            'tags.*' => 'string',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'author_name' => 'required|string',
        ]);

        // Admin creates articles and assigns to authors
        $user = Auth::user();
        if (! $user || ! $user->isAdmin()) {
            return response()->json(['error' => 'Admin access required'], 403);
        }

        // Find or create author by name
        $authorUser = User::where('name', $validated['author_name'])->first();

        if (! $authorUser) {
            return response()->json(['error' => 'Author user not found'], 404);
        }

        // Find or create author profile
        $author = Author::firstOrCreate(
            ['user_id' => $authorUser->id],
            ['bio' => ''] // Default empty bio
        );

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated, $author) {
            $imagePath = null;
            if ($request->hasFile('featured_image')) {
                try {
                    $imagePath = $this->cloudinaryService->uploadImage($request->file('featured_image'));
                    Log::info('Article image uploaded', ['path' => $imagePath]);
                } catch (\Exception $e) {
                    Log::error('Image upload failed', ['error' => $e->getMessage()]);

                    // Bubble up the exception to return a specific 422 error to the user
                    return response()->json(['error' => 'Featured image failed to upload to Cloudinary. Please try again.'], 422);
                }
            }

            // Slug generation is handled automatically by the Article Model's boot method
            // This prevents duplicate code and avoids race conditions without explicit locking.

            $status = $request->get('status', 'published');
            $article = Article::create([
                'title' => $validated['title'],
                // 'slug' is generated by Model boot method
                'content' => $validated['content'],
                'author_id' => $author->id,
                'author_name' => $validated['author_name'], // Store the custom author name
                'status' => $status,
                'published_at' => $status === 'published' ? now() : null,
                'excerpt' => Str::limit($validated['content'], 150),
                'featured_image' => $imagePath,
            ]);

            $article->categories()->attach($validated['category_id']);

            if (! empty($validated['tags'])) {
                $tagIds = [];
                foreach ($validated['tags'] as $tagName) {
                    $tag = Tag::firstOrCreate(['name' => trim($tagName)]);
                    $tagIds[] = $tag->id;
                }
                $article->tags()->sync($tagIds);
            }

            return response()->json($article->load('author.user', 'categories', 'tags'), 201);
        });
    }

    public function show(Article $article): JsonResponse|View
    {
        try {
            if (request()->wantsJson()) {
                $article->load(['author.user', 'categories', 'tags']);
                $article->loadCount(['interactions as likes_count' => function ($query) {
                    $query->where('type', 'liked');
                }]);
                if (Auth::check()) {
                    $article->loadExists(['interactions as is_liked' => function ($query) {
                        $query->where('user_id', Auth::id())->where('type', 'liked');
                    }]);
                }

                return response()->json($article);
            }

            return view('articles.show', compact('article'));
        } catch (\Exception $e) {
            Log::error('Error in ArticleController@show: '.$e->getMessage());

            return response()->json(['error' => 'Failed to load article: '.$e->getMessage()], 500);
        }
    }

    // Public-facing: show published article by slug
    public function publicShow(string $slug): View
    {
        $article = Article::published()
            ->with('author.user', 'categories', 'tags')
            ->withCount(['interactions as likes_count' => function ($query) {
                $query->where('type', 'liked');
            }])
            ->where('slug', $slug)
            ->firstOrFail();

        $related = \App\Models\Article::published()
            ->where('id', '!=', $article->id)
            ->whereHas('categories', function ($q) use ($article) {
                $q->whereIn('categories.id', $article->categories->pluck('id'));
            })
            ->with('author.user')
            ->latest('published_at')
            ->take(4)
            ->get();

        return view('articles.show', compact('article', 'related'));
    }

    public function edit(Article $article): View
    {
        $categories = Category::all();
        $tags = Tag::all();

        return view('articles.edit', compact('article', 'categories', 'tags'));
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string',
            'tags' => 'required|string',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'author' => 'required|string|min:1',
        ]);

        $oldValues = $article->toArray();

        // Authorize using policy (admins and moderators may update per policy)
        $this->authorize('update', $article);

        // Find user by name, then get their author profile
        $authorUser = User::where('name', $request->author)->first();
        if (! $authorUser) {
            return response()->json(['error' => 'Author user not found'], 404);
        }

        $author = Author::where('user_id', $authorUser->id)->first();
        if (! $author) {
            return response()->json(['error' => 'Author profile not found'], 404);
        }

        // The original slug is maintained. If the title is dirty and slug is empty, the Model boot handles it.

        $data = [
            'title' => $request->title,
            'content' => $request->input('content'),
            'author_id' => $author->id,
            'author_name' => $request->author,
            'excerpt' => Str::limit($request->input('content'), 150),
        ];

        // Handle status update
        if ($request->has('status')) {
            $data['status'] = $request->status;
            if ($request->status === 'published' && ! $article->published_at) {
                $data['published_at'] = now();
            }
        }

        if ($request->hasFile('featured_image')) {
            try {
                $imagePath = $this->cloudinaryService->uploadImage($request->file('featured_image'));
                if ($imagePath) {
                    $data['featured_image'] = $imagePath;
                }
            } catch (\Exception $e) {
                \Log::error('Cloudinary upload exception during update: '.$e->getMessage());

                return response()->json(['error' => 'Featured image failed to upload to Cloudinary. Please try again.'], 422);
            }
        }

        $article->update($data);

        // Handle category
        if ($request->category) {
            $category = Category::firstOrCreate(['name' => $request->category]);
            $article->categories()->sync([$category->id]);
        }

        // Handle tags
        if ($request->tags) {
            $tags = explode(',', $request->tags);
            $tagIds = [];
            foreach ($tags as $tagName) {
                $tag = Tag::firstOrCreate(['name' => trim($tagName)]);
                $tagIds[] = $tag->id;
            }
            $article->tags()->sync($tagIds);
        }

        // Logging removed as Log model is not available

        return response()->json($article->load('author.user', 'categories', 'tags'));
    }

    public function destroy(Article $article): JsonResponse
    {
        try {
            // Ensure user is authorized to delete (policy allows only admins)
            $this->authorize('delete', $article);

            $article->delete();

            return response()->json(['message' => 'Article deleted successfully']);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['error' => 'Unauthorized'], 403);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete article: '.$e->getMessage()], 500);
        }
    }

    public function like(Article $article): JsonResponse
    {
        $existing = ArticleInteraction::where('user_id', Auth::id())
            ->where('article_id', $article->id)
            ->where('type', 'liked')
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['liked' => false, 'likes_count' => $article->interactions()->where('type', 'liked')->count()]);
        }

        ArticleInteraction::create([
            'user_id' => Auth::id(),
            'article_id' => $article->id,
            'type' => 'liked',
        ]);

        return response()->json(['liked' => true, 'likes_count' => $article->interactions()->where('type', 'liked')->count()]);
    }

    public function share(Article $article): Response
    {
        ArticleInteraction::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'article_id' => $article->id,
                'type' => 'shared',
            ],
            []
        );

        return back()->with('success', 'Article shared!');
    }

    public function getLikedArticles(Request $request): JsonResponse
    {
        // Validate pagination parameters
        $perPage = min(max((int) $request->get('per_page', 10), 1), 100);
        $page = max((int) $request->get('page', 1), 1);

        $articles = Article::whereHas('interactions', function ($query) {
            $query->where('user_id', Auth::id())
                ->where('type', 'liked');
        })
            ->with('author.user', 'categories', 'tags')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json($articles);
    }

    public function getSharedArticles(Request $request): JsonResponse
    {
        // Validate pagination parameters
        $perPage = min(max((int) $request->get('per_page', 10), 1), 100);
        $page = max((int) $request->get('page', 1), 1);

        $articles = Article::whereHas('interactions', function ($query) {
            $query->where('user_id', Auth::id())
                ->where('type', 'shared');
        })
            ->with('author.user', 'categories', 'tags')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json($articles);
    }

    public function getArticlesByAuthor(Request $request, $authorId): JsonResponse
    {
        $author = Author::find($authorId);
        if (! $author) {
            return response()->json(['error' => 'Author not found'], 404);
        }

        $query = Article::where('author_id', $authorId)->with('author.user', 'categories', 'tags');

        // Filter by status if provided
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        } else {
            $query->published();
        }

        $query->latest('published_at');

        // Validate pagination parameters
        $perPage = min(max((int) $request->get('per_page', 10), 1), 100);
        $page = max((int) $request->get('page', 1), 1);

        $articles = $query->paginate($perPage, ['*'], 'page', $page);

        // Add article count to response
        $articleCount = Article::where('author_id', $authorId)->count();

        return response()->json([
            'articles' => $articles,
            'article_count' => $articleCount,
            'author' => $author->load('user'),
        ]);
    }

    // Public version of getArticlesByAuthor (no auth required)
    public function getArticlesByAuthorPublic(Request $request, $authorId): JsonResponse
    {
        $author = Author::find($authorId);
        if (! $author) {
            return response()->json(['error' => 'Author not found'], 404);
        }

        $query = Article::where('author_id', $authorId)->with('author.user', 'categories', 'tags');

        // Enforce published status for public endpoint unequivocally
        $query->published();

        $query->latest('published_at');

        // Validate pagination parameters
        $perPage = min(max((int) $request->get('per_page', 10), 1), 100);
        $page = max((int) $request->get('page', 1), 1);

        $articles = $query->paginate($perPage, ['*'], 'page', $page);

        $articleCount = Article::where('author_id', $authorId)->count();

        return response()->json([
            'articles' => $articles,
            'article_count' => $articleCount,
            'author' => $author->load('user'),
        ]);
    }
}
