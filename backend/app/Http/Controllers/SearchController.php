<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SearchController extends Controller
{
    public function index(Request $request): View
    {
        $q = trim((string) $request->get('q', ''));
        $articles = collect();

        if (strlen($q) >= 3) {
            // Escape special characters to prevent SQL injection
            $searchTerm = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q);

            $articles = Article::published()
                ->with('author.user', 'categories')
                ->where(function ($query) use ($searchTerm) {
                    $query->where('title', 'like', "%{$searchTerm}%")
                        ->orWhere('excerpt', 'like', "%{$searchTerm}%")
                        ->orWhere('content', 'like', "%{$searchTerm}%")
                        ->orWhereHas('author.user', function ($qry) use ($searchTerm) {
                            $qry->where('name', 'like', "%{$searchTerm}%");
                        })
                        ->orWhereHas('tags', function ($qry) use ($searchTerm) {
                            $qry->where('name', 'like', "%{$searchTerm}%");
                        });
                })
                ->latest('published_at')
                ->paginate(10);
        }

        return view('search.index', compact('articles', 'q'));
    }
}
