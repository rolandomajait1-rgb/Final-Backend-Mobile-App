<?php

namespace App\Http\Controllers;

use App\Models\Log;
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
            $tags = Tag::orderBy('name')->get();
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

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'created',
            'model_type' => 'Tag',
            'model_id' => $tag->id,
            'new_values' => $tag->toArray(),
        ]);

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

        $oldValues = $tag->toArray();

        $data = $request->all();
        $data['slug'] = Str::slug($request->name);

        $tag->update($data);

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'updated',
            'model_type' => 'Tag',
            'model_id' => $tag->id,
            'old_values' => $oldValues,
            'new_values' => $tag->toArray(),
        ]);

        return response()->json($tag);
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $oldValues = $tag->toArray();

        $tag->delete();

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'deleted',
            'model_type' => 'Tag',
            'model_id' => $tag->id,
            'old_values' => $oldValues,
        ]);

        return response()->json(['message' => 'Tag deleted successfully']);
    }
}
