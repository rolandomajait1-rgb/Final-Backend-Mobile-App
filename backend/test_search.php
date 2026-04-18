<?php
$query = "the";
$driver = \Illuminate\Support\Facades\DB::connection()->getDriverName();
$like = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';
$lowerQuery = strtolower($query);

$articles = \App\Models\Article::published()
    ->with('author.user', 'categories', 'tags')
    ->where(function ($q) use ($lowerQuery, $like) {
        $q->whereRaw("LOWER(title) {$like} ?", ["%{$lowerQuery}%"])
          ->orWhereRaw("LOWER(excerpt) {$like} ?", ["%{$lowerQuery}%"])
          ->orWhereRaw("LOWER(content) {$like} ?", ["%{$lowerQuery}%"])
          ->orWhereRaw("LOWER(author_name) {$like} ?", ["%{$lowerQuery}%"])
          ->orWhereHas('author.user', function ($authorQuery) use ($lowerQuery, $like) {
              $authorQuery->whereRaw("LOWER(name) {$like} ?", ["%{$lowerQuery}%"]);
          })
          ->orWhereHas('categories', function ($catQuery) use ($lowerQuery, $like) {
              $catQuery->whereRaw("LOWER(name) {$like} ?", ["%{$lowerQuery}%"]);
          })
          ->orWhereHas('tags', function ($tagQuery) use ($lowerQuery, $like) {
              $tagQuery->whereRaw("LOWER(name) {$like} ?", ["%{$lowerQuery}%"]);
          });
    })
    ->get();

echo "Found: " . $articles->count() . "\n";
