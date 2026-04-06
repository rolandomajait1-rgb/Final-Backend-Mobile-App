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
                if (! $user || (! $user->isAdmin() && ! $user->isModerator())) {
                    return response()->json(['error' => 'Admin or moderator access required for drafts'], 403);
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
                $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
                $like = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
                $q->where('name', $like, $request->category);
            });
        }

        // Filter by tag if provided
        if ($request->has('tag') && $request->tag) {
            \Log::info('Filtering by tag: ' . $request->tag);
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('name', $request->tag);
            });
            \Log::info('Articles count after tag filter: ' . $query->count());
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
        $articles = Article::published()
            ->with('author.user', 'categories', 'tags')
            ->latest('published_at')
            ->take(6)
            ->get();

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
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'category_id' => 'required|exists:categories,id',
                'tags' => 'array',
                'tags.*' => 'string',
                'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'featured_image_url' => 'nullable|url',
                'author_name' => 'required|string',
                'status' => 'nullable|in:published,draft',
            ]);

            // Admins and moderators can create articles
            $user = Auth::user();
            if (! $user || (! $user->isAdmin() && ! $user->isModerator())) {
                Log::warning('Unauthorized article creation attempt', ['user_id' => Auth::id()]);
                return response()->json(['error' => 'Admin or moderator access required'], 403);
            }

            Log::info('Creating article', ['title' => $validated['title'], 'author_name' => $validated['author_name']]);

            // Find or create author by name
            $authorUser = User::where('name', $validated['author_name'])->first();

            if (! $authorUser) {
                // Auto-create user for the author if not exists
                // Generate unique email
                $baseEmail = Str::slug($validated['author_name']) . '@laverdad.edu.ph';
                $email = $baseEmail;
                $counter = 1;
                
                while (User::where('email', $email)->exists()) {
                    $emailParts = explode('@', $baseEmail);
                    $email = $emailParts[0] . $counter . '@' . $emailParts[1];
                    $counter++;
                }
                
                Log::info('Creating new author user', ['name' => $validated['author_name'], 'email' => $email]);
                
                $authorUser = User::create([
                    'name' => $validated['author_name'],
                    'email' => $email,
                    'password' => bcrypt(Str::random(32)), // Random password
                    'email_verified_at' => now(),
                ]);
            }

            // Find or create author profile
            $author = Author::firstOrCreate(
                ['user_id' => $authorUser->id],
                ['bio' => ''] // Default empty bio
            );

            Log::info('Author resolved', ['author_id' => $author->id, 'user_id' => $authorUser->id]);

            return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated, $author) {
                $imagePath = null;
                
                // Check if image URL is provided (direct Cloudinary upload)
                if ($request->has('featured_image_url') && $request->featured_image_url) {
                    $imagePath = $request->featured_image_url;
                    Log::info('Using direct Cloudinary URL', ['url' => $imagePath]);
                }
                // Otherwise try file upload (fallback)
                elseif ($request->hasFile('featured_image')) {
                    try {
                        Log::info('Uploading featured image');
                        $imagePath = $this->cloudinaryService->uploadImage($request->file('featured_image'));
                        Log::info('Article image uploaded', ['path' => $imagePath]);
                    } catch (\Exception $e) {
                        Log::error('Image upload failed', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                        ]);
                        Log::warning('Continuing article creation without image');
                        $imagePath = null;
                    }
                }

                $status = $request->get('status', 'published');
                Log::info('Creating article record', ['status' => $status, 'has_image' => !!$imagePath]);
                
                $article = Article::create([
                    'title' => $validated['title'],
                    'content' => $validated['content'],
                    'author_id' => $author->id,
                    'author_name' => $validated['author_name'],
                    'status' => $status,
                    'published_at' => $status === 'published' ? now() : null,
                    'excerpt' => Str::limit($validated['content'], 150),
                    'featured_image' => $imagePath,
                ]);

                Log::info('Article created', ['article_id' => $article->id, 'slug' => $article->slug]);

                $article->categories()->attach($validated['category_id']);

                if (! empty($validated['tags'])) {
                    $tagIds = [];
                    foreach ($validated['tags'] as $tagName) {
                        $cleanName = ltrim(trim($tagName), '#');
                        if ($cleanName === '') continue;
                        $tag = Tag::firstOrCreate(['name' => $cleanName]);
                        $tagIds[] = $tag->id;
                    }
                    $article->tags()->sync($tagIds);
                    Log::info('Tags attached', ['article_id' => $article->id, 'tag_count' => count($tagIds)]);
                }

                Log::info('Article creation completed successfully', ['article_id' => $article->id]);
                return response()->json($article->load('author.user', 'categories', 'tags'), 201);
            });
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed', ['errors' => $e->errors()]);
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Article creation failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
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
            'tags' => 'nullable|string',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'author' => 'required|string|min:1',
        ]);

        $oldValues = $article->toArray();

        // Authorize using policy (admins and moderators may update per policy)
        $this->authorize('update', $article);

        // Find or create author by name (same logic as store method)
        $authorUser = User::where('name', $request->author)->first();

        if (! $authorUser) {
            // Auto-create user for the author if not exists
            $baseEmail = Str::slug($request->author) . '@laverdad.edu.ph';
            $email = $baseEmail;
            $counter = 1;
            
            while (User::where('email', $email)->exists()) {
                $emailParts = explode('@', $baseEmail);
                $email = $emailParts[0] . $counter . '@' . $emailParts[1];
                $counter++;
            }
            
            Log::info('Creating new author user during update', ['name' => $request->author, 'email' => $email]);
            
            $authorUser = User::create([
                'name' => $request->author,
                'email' => $email,
                'password' => bcrypt(Str::random(32)),
                'email_verified_at' => now(),
            ]);
        }

        // Find or create author profile
        $author = Author::firstOrCreate(
            ['user_id' => $authorUser->id],
            ['bio' => '']
        );

        Log::info('Author resolved for update', ['author_id' => $author->id, 'user_id' => $authorUser->id]);

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
                $cleanName = ltrim(trim($tagName), '#');
                if ($cleanName === '') continue;
                $tag = Tag::firstOrCreate(['name' => $cleanName]);
                $tagIds[] = $tag->id;
            }
            $article->tags()->sync($tagIds);
        }

        // Log the update
        try {
            \App\Models\Log::create([
                'user_id'    => Auth::id(),
                'action'     => 'update',
                'model_type' => 'App\\Models\\Article',
                'model_id'   => $article->id,
                'old_values' => ['title' => $oldValues['title'] ?? null, 'status' => $oldValues['status'] ?? null],
                'new_values' => ['title' => $article->title, 'status' => $article->status],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to write audit log: ' . $e->getMessage());
        }

        return response()->json($article->load('author.user', 'categories', 'tags'));
    }

    public function destroy(Article $article): JsonResponse
    {
        try {
            // Ensure user is authorized to delete (policy allows only admins)
            $this->authorize('delete', $article);

            $articleId = $article->id;
            $articleTitle = $article->title;

            $article->delete();

            \App\Models\Log::create([
                'user_id'    => Auth::id(),
                'action'     => 'delete',
                'model_type' => 'App\\Models\\Article',
                'model_id'   => $articleId,
                'old_values' => ['id' => $articleId, 'title' => $articleTitle],
            ]);

            return response()->json(['message' => 'Article deleted successfully', 'id' => $articleId]);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['error' => 'Unauthorized'], 403);
        } catch (\Exception $e) {
            Log::error('Article deletion failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
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
