<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\View\View;

class TagController extends Controller
{
    public function index(): JsonResponse
    {
        // Return all tags for public API, paginated for admin
        if (request()->is('api/*') && !request()->user()) {
            $tags = \Illuminate\Support\Facades\Cache::remember('tags_all', 3600, function () {
                return Tag::orderBy('name')->get();
            });
            return response()->json(['data' => $tags]);
        }

        $tags = Tag::withCount('articles')->orderBy('name')->paginate(50);
        return response()->json($tags);
    }

    public function create(): View
    {
        return view('tags.create');
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:tags',
        ]);

        $data = $request->all();
        $data['slug'] = Str::slug($request->name);

        $tag = Tag::create($data);

        if (request()->wantsJson()) {
            return response()->json($tag, 201);
        }

        return redirect()->route('tags.index')->with('success', 'Tag created successfully.');
    }

    public function show(Tag $tag): JsonResponse
    {
        $tag->load('articles');
        return response()->json($tag);
    }

    // Public-facing: view tag by slug
    public function publicShow(string $slug): View
    {
        $tag = Tag::where('slug', $slug)->firstOrFail();
        $articles = Article::published()
            ->whereHas('tags', function ($query) use ($tag) {
                $query->where('tags.id', $tag->id);
            })
            ->with('author.user', 'categories')
            ->latest('published_at')
            ->paginate(10);

        return view('tags.public', compact('tag', 'articles'));
    }

    public function edit(Tag $tag): View
    {
        return view('tags.edit', compact('tag'));
    }

    public function update(Request $request, Tag $tag): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:tags,name,'.$tag->id,
        ]);

        $data = $request->all();
        $data['slug'] = Str::slug($request->name);

        $tag->update($data);

        return response()->json($tag);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();

        return response()->json(['message' => 'Tag deleted successfully']);
    }
}
