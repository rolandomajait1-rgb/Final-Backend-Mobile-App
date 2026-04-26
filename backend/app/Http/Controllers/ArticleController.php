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

                // Moderators can only see their own created drafts
                if ($user->isModerator()) {
                    $myDraftIds = \App\Models\Log::where('user_id', $user->id)
                        ->where('model_type', 'App\\Models\\Article')
                        ->where('action', 'create_draft')
                        ->pluck('model_id');
                    $query->whereIn('id', $myDraftIds);
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
            return response()->json($articles)
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');
        }

        return view('articles.index', compact('articles'));
    }

    public function publicIndex(Request $request): JsonResponse
    {
        $perPage  = min(max((int) $request->get('per_page', $request->get('limit', 10)), 1), 100);
        $category = trim($request->get('category', ''));
        $tag      = trim($request->get('tag', ''));

        $query = Article::published()
            ->with('categories', 'tags')
            ->withCount(['interactions as likes_count' => fn ($q) => $q->where('type', 'liked')])
            ->latest('published_at');

        // Filter by category name (exact, case-insensitive)
        if ($category !== '') {
            $query->whereHas('categories', fn ($q) => $q->whereRaw('LOWER(name) = ?', [strtolower($category)]));
        }

        // Filter by tag name (exact, case-insensitive)
        if ($tag !== '') {
            $query->whereHas('tags', fn ($q) => $q->whereRaw('LOWER(name) = ?', [strtolower($tag)]));
        }

        return response()->json($query->paginate($perPage))
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function publicSearch(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 20)));

        $query = trim($query);
        $query = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $query);

        if (strlen($query) < 1) {
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
            ->with('author.user', 'categories', 'tags')
            ->where(function ($q) use ($query) {
                $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
                $like = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
                $lowerQuery = strtolower($query);
                
                // Use LOWER() for case-insensitive search on all databases
                $q->whereRaw("LOWER(title) {$like} ?", ["%{$lowerQuery}%"])
                    ->orWhereRaw("LOWER(excerpt) {$like} ?", ["%{$lowerQuery}%"])
                    ->orWhereRaw("LOWER(content) {$like} ?", ["%{$lowerQuery}%"])
                    ->orWhereRaw("LOWER(author_name) {$like} ?", ["%{$lowerQuery}%"])
                    // Search by author user name
                    ->orWhereHas('author.user', function ($authorQuery) use ($lowerQuery, $like) {
                        $authorQuery->whereRaw("LOWER(name) {$like} ?", ["%{$lowerQuery}%"]);
                    })
                    // Search by category name
                    ->orWhereHas('categories', function ($catQuery) use ($lowerQuery, $like) {
                        $catQuery->whereRaw("LOWER(name) {$like} ?", ["%{$lowerQuery}%"]);
                    })
                    // Search by tag name
                    ->orWhereHas('tags', function ($tagQuery) use ($lowerQuery, $like) {
                        $tagQuery->whereRaw("LOWER(name) {$like} ?", ["%{$lowerQuery}%"]);
                    });
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
        try {
            // Validate slug format
            if (empty($slug) || strlen($slug) > 255) {
                return response()->json(['message' => 'Invalid article slug'], 400);
            }

            $article = Article::published()
                ->with('author.user', 'categories', 'tags')
                ->where('slug', $slug)
                ->first();

            if (!$article) {
                return response()->json(['message' => 'Article not found'], 404);
            }

            // Increment view count
            $article->increment('view_count');

            // Load like counts
            $article->loadCount(['interactions as likes_count' => function ($query) {
                $query->where('type', 'liked');
            }]);

            // Load user_liked status if authenticated
            if (Auth::check()) {
                $article->loadExists(['interactions as user_liked' => function ($query) {
                    $query->where('user_id', Auth::id())->where('type', 'liked');
                }]);
            } else {
                $article->user_liked = false;
            }

            return response()->json($article);
        } catch (\Exception $e) {
            Log::error('Article fetch by slug failed', [
                'slug' => $slug,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to fetch article'], 500);
        }
    }

    public function publicById($id): JsonResponse
    {
        try {
            // Validate that ID is numeric
            if (!is_numeric($id)) {
                return response()->json(['message' => 'Invalid article ID'], 400);
            }

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

            // Load user_liked status if authenticated
            if (Auth::check()) {
                $article->loadExists(['interactions as user_liked' => function ($query) {
                    $query->where('user_id', Auth::id())->where('type', 'liked');
                }]);
            } else {
                $article->user_liked = false;
            }

            return response()->json($article);
        } catch (\Exception $e) {
            Log::error('Article fetch by ID failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to fetch article'], 500);
        }
    }

    public function latestArticles(): JsonResponse
    {
        // Always fetch fresh data - no caching
        $articles = Article::published()
            ->with('author.user', 'categories', 'tags')
            ->withCount(['interactions as likes_count' => fn ($q) => $q->where('type', 'liked')])
            ->latest('published_at')
            ->take(6)
            ->get();

        return response()->json($articles)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
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
            // Log content length for debugging
            $contentLength = strlen($request->input('content', ''));
            Log::info('Article content length received', ['length' => $contentLength]);
            
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'category_id' => 'required|exists:categories,id',
                'tags' => 'nullable|array',
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

            // Find or create Author directly by name — goes to authors table, NOT users table
            $author = Author::firstOrCreate(
                ['name' => $validated['author_name']],
                ['bio'  => '']
            );

            Log::info('Author resolved', ['author_id' => $author->id, 'name' => $author->name]);

            return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $validated, $author, $contentLength, $user) {
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
                
                if ($status === 'published' && $user->isModerator()) {
                    return response()->json(['error' => 'Moderators cannot publish articles directly.'], 403);
                }

                Log::info('Creating article record', ['status' => $status, 'has_image' => !!$imagePath]);
                
                $article = Article::create([
                    'title'         => $validated['title'],
                    'content'       => $validated['content'],
                    'author_id'     => $author->id,
                    'author_name'   => $validated['author_name'],
                    'status'        => $status,
                    'published_at'  => $status === 'published' ? now() : null,
                    'excerpt'       => Str::limit(strip_tags($validated['content']), 150),
                    'featured_image'=> $imagePath,
                ]);

                // Log content length after save for debugging
                $savedContentLength = strlen($article->content);
                Log::info('Article created', [
                    'article_id' => $article->id, 
                    'slug' => $article->slug,
                    'content_length_saved' => $savedContentLength,
                    'content_length_original' => $contentLength
                ]);

                // Use sync() instead of attach() to prevent duplicates
                $article->categories()->sync([$validated['category_id']]);

                // Handle tags - always sync (even if empty array to clear tags)
                $tagIds = [];
                if (!empty($validated['tags'])) {
                    foreach ($validated['tags'] as $tagName) {
                        $cleanName = ltrim(trim($tagName), '#');
                        if ($cleanName === '') continue;
                        $tag = Tag::firstOrCreate(['name' => $cleanName]);
                        $tagIds[] = $tag->id;
                    }
                }
                $article->tags()->sync($tagIds);
                Log::info('Tags attached', ['article_id' => $article->id, 'tag_count' => count($tagIds)]);

                // Create audit log for article creation
                try {
                    \App\Models\Log::create([
                        'user_id'    => Auth::id(),
                        'action'     => $status === 'published' ? 'publish' : 'create_draft',
                        'model_type' => 'App\\Models\\Article',
                        'model_id'   => $article->id,
                        'new_values' => ['title' => $article->title, 'status' => $status],
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Failed to write audit log: ' . $e->getMessage());
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

        $related = Article::published()
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

    /**
     * Handle the scenario where a moderator edits a published article.
     * This creates a new draft version instead of mutating the published record.
     */
    protected function handleModeratorPublishedEdit(Request $request, Article $article, Author $author, string $plainContent, $user): JsonResponse
    {
        $imagePath = $article->featured_image;
        
        // Handle image update
        if ($request->has('featured_image_url')) {
            $imagePath = $request->featured_image_url ?: null;
        } elseif ($request->hasFile('featured_image')) {
            try {
                $newPath = $this->cloudinaryService->uploadImage($request->file('featured_image'));
                if ($newPath) {
                    $imagePath = $newPath;
                }
            } catch (\Exception $e) {
                return response()->json(['error' => 'Featured image failed to upload.'], 422);
            }
        }
        
        // If remove_image flag is set, clear the image
        if ($request->has('remove_image') && $request->remove_image) {
            $imagePath = null;
        }

        // Get author name from either field
        $authorName = $request->input('author') ?? $request->input('author_name');

        $draft = Article::create([
            'title'         => $request->title,
            'content'       => $request->input('content'),
            'author_id'     => $author->id,
            'author_name'   => $authorName,
            'status'        => 'draft',
            'published_at'  => null,
            'excerpt'       => Str::limit($plainContent, 150),
            'featured_image'=> $imagePath,
        ]);

        // Handle category - accept both 'category' (string name) and 'category_id' (integer)
        // Only sync if category field is present
        if ($request->has('category_id')) {
            $draft->categories()->sync([$request->category_id]);
        } elseif ($request->has('category')) {
            $category = Category::firstOrCreate(['name' => $request->category]);
            $draft->categories()->sync([$category->id]);
        }

        // Handle tags - accept both string (comma-separated) and array
        // ONLY sync if tags field is explicitly present in the request
        if ($request->has('tags')) {
            $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
            $tagIds = [];
            foreach ($tags as $tagName) {
                $cleanName = ltrim(trim($tagName), '#');
                if ($cleanName === '') continue;
                $tag = Tag::firstOrCreate(['name' => $cleanName]);
                $tagIds[] = $tag->id;
            }
            $draft->tags()->sync($tagIds);
        }

        try {
            \App\Models\Log::create([
                'user_id'    => Auth::id(),
                'action'     => 'create_draft',
                'model_type' => 'App\\Models\\Article',
                'model_id'   => $draft->id,
                'new_values' => ['title' => $draft->title, 'status' => 'draft'],
            ]);
        } catch (\Exception $e) {
            // silent catch
        }

        return response()->json($draft->load('author', 'categories', 'tags'));
    }

    protected function executeMainArticleUpdate(Request $request, Article $article, Author $author, string $plainContent, array $oldValues): JsonResponse
    {
        // Get author name from either field
        $authorName = $request->input('author') ?? $request->input('author_name');
        
        $data = [
            'title'       => $request->title,
            'content'     => $request->input('content'),
            'author_id'   => $author->id,
            'author_name' => $authorName,
            'excerpt'     => Str::limit($plainContent, 150),
        ];

        // Handle status update
        if ($request->has('status')) {
            $data['status'] = $request->status;
            if ($request->status === 'published' && ! $article->published_at) {
                $data['published_at'] = now();
            }
        }

        // Handle image - support URL, file upload, or removal
        if ($request->has('featured_image_url')) {
            // If featured_image_url is explicitly set (even if null/empty), use it
            $data['featured_image'] = $request->featured_image_url ?: null;
        } elseif ($request->hasFile('featured_image')) {
            try {
                $imagePath = $this->cloudinaryService->uploadImage($request->file('featured_image'));
                if ($imagePath) {
                    $data['featured_image'] = $imagePath;
                }
            } catch (\Exception $e) {
                return response()->json(['error' => 'Featured image failed to upload to Cloudinary. Please try again.'], 422);
            }
        }
        // If remove_image flag is set, clear the image
        if ($request->has('remove_image') && $request->remove_image) {
            $data['featured_image'] = null;
        }

        $article->update($data);

        // Handle category - accept both 'category' (string name) and 'category_id' (integer)
        // Only sync if category field is present
        if ($request->has('category_id')) {
            $article->categories()->sync([$request->category_id]);
        } elseif ($request->has('category')) {
            $category = Category::firstOrCreate(['name' => $request->category]);
            $article->categories()->sync([$category->id]);
        }

        // Handle tags - accept both string (comma-separated) and array
        // ONLY sync if tags field is explicitly present in the request
        if ($request->has('tags')) {
            $tags = is_array($request->tags) ? $request->tags : explode(',', $request->tags);
            $tagIds = [];
            foreach ($tags as $tagName) {
                $cleanName = ltrim(trim($tagName), '#');
                if ($cleanName === '') continue;
                $tag = Tag::firstOrCreate(['name' => $cleanName]);
                $tagIds[] = $tag->id;
            }
            // Sync tags (empty array will clear all tags if that's the intention)
            $article->tags()->sync($tagIds);
        }

        // Determine the action based on status changes
        $action = 'update';
        $oldStatus = $oldValues['status'] ?? null;
        $newStatus = $article->status;
        
        if ($oldStatus === 'draft' && $newStatus === 'published') {
            $action = 'publish';
        } elseif ($oldStatus === 'published' && $newStatus === 'draft') {
            $action = 'save_as_draft';
        } elseif ($oldStatus === 'draft' && $newStatus === 'draft') {
            $action = 'update_draft';
        }

        try {
            \App\Models\Log::create([
                'user_id'    => Auth::id(),
                'action'     => $action,
                'model_type' => 'App\\Models\\Article',
                'model_id'   => $article->id,
                'old_values' => ['title' => $oldValues['title'] ?? null, 'status' => $oldValues['status'] ?? null],
                'new_values' => ['title' => $article->title, 'status' => $article->status],
            ]);
        } catch (\Exception $e) {}

        return response()->json($article->load('author', 'categories', 'tags'));
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        try {
            // Log content length for debugging
            $contentLength = strlen($request->input('content', ''));
            Log::info('Article update - content length received', ['length' => $contentLength, 'article_id' => $article->id]);

            $request->validate([
                'title'              => 'required|string|max:255',
                'content'            => 'required|string',
                'category'           => 'required_without:category_id|string',
                'category_id'        => 'required_without:category|exists:categories,id',
                'tags'               => 'nullable',
                'featured_image'     => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'featured_image_url' => 'nullable|url',
                'author'             => 'required_without:author_name|string|min:1',
                'author_name'        => 'required_without:author|string|min:1',
                'status'             => 'nullable|in:published,draft',
            ]);

            $oldValues = $article->toArray();

            $isPublished = ($oldValues['status'] ?? null) === 'published';
            $user = Auth::user();

            // Get author name from either 'author' or 'author_name' field
            $authorName = $request->input('author') ?? $request->input('author_name');
            
            // Find or create Author directly by name
            $author = Author::firstOrCreate(
                ['name' => $authorName],
                ['bio'  => '']
            );

            // Strip HTML tags for excerpt so it's plain text
            $plainContent = strip_tags($request->input('content'));

            if ($user && $user->isModerator()) {
                if ($request->status === 'published') {
                    return response()->json(['message' => 'Moderators cannot publish articles.'], 403);
                }

                if ($isPublished) {
                    // Edits to published articles by a moderator create a new draft for Admin approval
                    return $this->handleModeratorPublishedEdit($request, $article, $author, $plainContent, $user);
                } else {
                    // Cannot edit drafts created by Admins or other Moderators
                    $creatorLog = \App\Models\Log::where('model_type', 'App\\Models\\Article')
                        ->where('model_id', $article->id)
                        ->where('action', 'create_draft')
                        ->orderBy('created_at', 'asc')
                        ->first();
                    
                    if ($creatorLog && $creatorLog->user_id !== $user->id) {
                        return response()->json(['message' => 'You can only edit drafts that you originally created.'], 403);
                    }
                }
            }

            // Authorize using policy
            $this->authorize('update', $article);

            return $this->executeMainArticleUpdate($request, $article, $author, $plainContent, $oldValues);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Article update validation failed', ['errors' => $e->errors(), 'article_id' => $article->id]);
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            Log::warning('Article update unauthorized', ['user_id' => Auth::id(), 'article_id' => $article->id]);
            return response()->json(['message' => 'You are not authorized to update this article.'], 403);
        } catch (\Exception $e) {
            Log::error('Article update failed', [
                'article_id' => $article->id,
                'error'      => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Server error', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Article $article): JsonResponse
    {
        try {
            // Check if article exists
            if (!$article || !$article->id) {
                return response()->json(['error' => 'Article not found'], 404);
            }

            $user = Auth::user();
            
            // Check if user is authenticated
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            // Moderators cannot delete articles
            if ($user->isModerator()) {
                return response()->json(['error' => 'Moderators cannot delete articles.'], 403);
            }

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
            Log::warning('Article deletion unauthorized', [
                'article_id' => $article->id ?? null,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Unauthorized to delete this article'], 403);
        } catch (\Exception $e) {
            Log::error('Article deletion failed', [
                'article_id' => $article->id ?? null,
                'user_id' => Auth::id(),
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

    public function share(Article $article): JsonResponse
    {
        // Increment the total share count on the article table
        $article->increment('shares_count');

        // If the user is logged in, record that they shared it
        if (Auth::check()) {
            ArticleInteraction::firstOrCreate([
                'user_id' => Auth::id(),
                'article_id' => $article->id,
                'type' => 'shared',
            ]);
        }

        return response()->json([
            'shared' => true, 
            'shares_count' => $article->shares_count
        ]);
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
            ->with('categories', 'tags', 'author.user')
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
            ->with('categories', 'tags', 'author.user')
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
