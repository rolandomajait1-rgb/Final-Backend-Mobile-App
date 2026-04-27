<?php

namespace App\Http\Controllers;

use App\Models\Article;
use App\Models\Author;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class AuthorController extends Controller
{
    public function index(): JsonResponse|View
    {
        $authors = Author::with('user')->paginate(10);
        // For API endpoints, default to JSON unless explicitly requesting HTML
        if (request()->wantsJson() || request()->is('api/*')) {
            return response()->json($authors);
        }

        return view('authors.index', compact('authors'));
    }

    public function create(): View
    {
        return view('authors.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'bio' => 'nullable|string',
            'website' => 'nullable|url',
            'social_links' => 'nullable|array',
        ]);

        DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $author = Author::create([
                'user_id' => $user->id,
                'bio' => $request->bio,
                'website' => $request->website,
                'social_links' => $request->social_links,
            ]);
        });

        return redirect()->route('authors.index')->with('success', 'Author created successfully.');
    }

    public function show(Author $author): View
    {
        return view('authors.show', compact('author'));
    }

    // Public-facing: view author by user id
    public function publicShow(int $userId): View
    {
        $author = Author::where('user_id', $userId)->firstOrFail();
        $articles = Article::published()
            ->where('author_id', $author->id)
            ->with('author.user', 'categories', 'tags')
            ->latest('published_at')
            ->paginate(10);

        return view('authors.public', compact('author', 'articles'));
    }

    public function edit(Author $author): View
    {
        return view('authors.edit', compact('author'));
    }

    public function update(Request $request, Author $author): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$author->user_id,
            'bio' => 'nullable|string',
            'website' => 'nullable|url',
            'social_links' => 'nullable|array',
        ]);

        $oldValues = [
            'name' => $author->user->name,
            'email' => $author->user->email,
            'bio' => $author->bio,
            'website' => $author->website,
            'social_links' => $author->social_links,
        ];

        $author->user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        $author->update([
            'bio' => $request->bio,
            'website' => $request->website,
            'social_links' => $request->social_links,
        ]);

        return redirect()->route('authors.index')->with('success', 'Author updated successfully.');
    }

    public function destroy(Author $author): RedirectResponse
    {
        $oldValues = [
            'name' => $author->user->name,
            'email' => $author->user->email,
            'bio' => $author->bio,
            'website' => $author->website,
            'social_links' => $author->social_links,
        ];

        DB::transaction(function () use ($author, $oldValues) {
            $author->user->delete();
            $author->delete();
        });

        return redirect()->route('authors.index')->with('success', 'Author deleted successfully.');
    }

    public function publicIndex(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 20)));

        $authors = Author::with('user:id,name,email')
            ->paginate($perPage, ['*'], 'page', $page);

        $formattedAuthors = $authors->map(function ($author) {
            return [
                'id' => $author->id,
                'name' => $author->name,
                'user_id' => $author->user_id,
                'bio' => $author->bio,
                'website' => $author->website,
            ];
        });

        return response()->json([
            'data' => $formattedAuthors,
            'meta' => [
                'current_page' => $authors->currentPage(),
                'per_page' => $authors->perPage(),
                'total' => $authors->total(),
                'last_page' => $authors->lastPage(),
            ],
        ]);
    }

    public function publicAuthorsByName(Request $request, $authorName): JsonResponse
    {
        $user = User::where('name', $authorName)
            ->orWhere('email', $authorName)
            ->first();

        if (! $user) {
            return response()->json(['message' => 'Author not found'], 404);
        }

        $author = Author::where('user_id', $user->id)->first();
        if (! $author) {
            return response()->json(['message' => 'Author profile not found'], 404);
        }

        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(50, max(10, (int) $request->get('per_page', 20)));

        $articles = Article::with('author.user', 'categories')
            ->where('author_id', $author->id)
            ->where('status', 'published')
            ->latest('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        $formattedArticles = $articles->map(function ($article) {
            return [
                'id' => $article->id,
                'title' => $article->title,
                'content' => $article->content,
                'excerpt' => $article->excerpt,
                'image_url' => $article->featured_image_url,
                'category' => $article->categories->first()?->name ?? 'Uncategorized',
                'author' => $article->author->name,
                'created_at' => $article->created_at,
                'slug' => $article->slug,
                'status' => $article->status,
            ];
        });

        return response()->json([
            'author' => [
                'name' => $user->name,
                'articleCount' => $articles->total(),
            ],
            'articles' => $formattedArticles,
            'meta' => [
                'current_page' => $articles->currentPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
                'last_page' => $articles->lastPage(),
            ],
        ]);
    }
}
