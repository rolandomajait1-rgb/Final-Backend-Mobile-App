<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\View\View;

class WelcomeController extends Controller
{
    public function index(): View
    {
            $data = \Illuminate\Support\Facades\Cache::remember('welcome_page_data', 300, function () {
                // Fetch Latest News: 1 featured + 3 recent
                $featuredNews = Article::with('categories')
                    ->published()
                    ->whereHas('categories', function ($query) {
                        $query->where('slug', 'news');
                    })
                    ->latest()
                    ->first();
    
                $newsArticles = Article::with('categories')
                    ->published()
                    ->whereHas('categories', function ($query) {
                        $query->where('slug', 'news');
                    })
                    ->latest()
                    ->when($featuredNews, function ($query) use ($featuredNews) {
                        return $query->where('id', '!=', $featuredNews->id);
                    })
                    ->take(3)
                    ->get();
    
                // Fetch 2 articles each for other categories
                $opinionArticles = Article::with('categories')
                    ->published()
                    ->whereHas('categories', function ($query) {
                        $query->where('slug', 'opinion');
                    })
                    ->latest()
                    ->take(2)
                    ->get();
    
                $sportsArticles = Article::with('categories')
                    ->published()
                    ->whereHas('categories', function ($query) {
                        $query->where('slug', 'sports');
                    })
                    ->latest()
                    ->take(2)
                    ->get();
    
                $featuresArticles = Article::with('categories')
                    ->published()
                    ->whereHas('categories', function ($query) {
                        $query->where('slug', 'features');
                    })
                    ->latest()
                    ->take(2)
                    ->get();
    
                $literaryArticles = Article::with('categories')
                    ->published()
                    ->whereHas('categories', function ($query) {
                        $query->where('slug', 'literary');
                    })
                    ->latest()
                    ->take(2)
                    ->get();
    
                $specialsArticles = Article::with('categories')
                    ->published()
                    ->whereHas('categories', function ($query) {
                        $query->where('slug', 'specials');
                    })
                    ->latest()
                    ->take(2)
                    ->get();
                    
                return compact(
                    'featuredNews',
                    'newsArticles',
                    'opinionArticles',
                    'sportsArticles',
                    'featuresArticles',
                    'literaryArticles',
                    'specialsArticles'
                );
            });

            return view('about.landingpage', $data);
    }
}
