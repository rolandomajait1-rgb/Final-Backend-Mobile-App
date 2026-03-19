<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\View\View;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        // Always return a flat array for API consumers regardless of auth state
        $categories = Category::orderBy('name')->get();
        return response()->json($categories);
    }

    public function create(): View
    {
        return view('categories.create');
    }

    public function store(Request $request): JsonResponse|Response
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        Log::create([
            'user_id'    => Auth::id(),
            'action'     => 'created',
            'model_type' => 'Category',
            'model_id'   => $category->id,
            'new_values' => $category->toArray(),
        ]);

        if (request()->wantsJson()) {
            return response()->json($category, 201);
        }

        return redirect()->route('categories.index')->with('success', 'Category created successfully.');
    }

    public function show(Category $category): JsonResponse|View
    {
        if (request()->wantsJson()) {
            return response()->json($category);
        }

        return view('categories.show', compact('category'));
    }

    // Public-facing: view category by slug with published articles
    public function publicShow(string $slug): View
    {
        $category = Category::where('slug', $slug)->firstOrFail();
        $articles = \App\Models\Article::published()
            ->with('author.user', 'categories', 'tags')
            ->whereHas('categories', function ($q) use ($category) {
                $q->where('categories.id', $category->id);
            })
            ->latest('published_at')
            ->paginate(10);

        return view('categories.public', compact('category', 'articles'));
    }

    public function edit(Category $category): View
    {
        return view('categories.edit', compact('category'));
    }

    public function update(Request $request, Category $category): JsonResponse|Response
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,'.$category->id,
            'description' => 'nullable|string',
        ]);

        $oldValues = $category->toArray();

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'updated',
            'model_type' => 'Category',
            'model_id' => $category->id,
            'old_values' => $oldValues,
            'new_values' => $category->toArray(),
        ]);

        if (request()->wantsJson()) {
            return response()->json($category);
        }

        return redirect()->route('categories.index')->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): JsonResponse|Response
    {
        $oldValues = $category->toArray();

        $category->delete();

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'deleted',
            'model_type' => 'Category',
            'model_id' => $category->id,
            'old_values' => $oldValues,
        ]);

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Category deleted successfully']);
        }

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully.');
    }

    public function getArticlesByCategory(Request $request, $category): JsonResponse
    {
        $driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
        $like   = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';

        $categoryModel = Category::where('name', $like, $category)
            ->orWhere('slug', $category)
            ->firstOrFail();

        $perPage = min(max((int) $request->get('per_page', 12), 1), 100);

        $articles = \App\Models\Article::published()
            ->with('author.user', 'categories', 'tags')
            ->whereHas('categories', function ($q) use ($categoryModel) {
                $q->where('categories.id', $categoryModel->id);
            })
            ->latest('published_at')
            ->paginate($perPage);

        return response()->json($articles);
    }
}
