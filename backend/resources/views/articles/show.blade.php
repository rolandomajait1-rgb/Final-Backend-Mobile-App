<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $article->title }} - La Verdad Herald</title>
    
    <!-- Primary Meta Tags -->
    <meta name="title" content="{{ $article->title }}">
    <meta name="description" content="{{ $article->excerpt ?? Str::limit(strip_tags($article->content), 150) }}">
    <meta name="author" content="{{ $article->author_name ?? $article->author->user->name ?? 'La Verdad Herald' }}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="{{ url('/articles/' . ($article->slug ?? $article->id)) }}">
    <meta property="og:title" content="{{ $article->title }}">
    <meta property="og:description" content="{{ $article->excerpt ?? Str::limit(strip_tags($article->content), 150) }}">
    @if($article->featured_image)
    <meta property="og:image" content="{{ $article->featured_image }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    @endif
    <meta property="og:site_name" content="La Verdad Herald">
    <meta property="article:published_time" content="{{ $article->published_at }}">
    <meta property="article:author" content="{{ $article->author_name ?? $article->author->user->name ?? 'La Verdad Herald' }}">
    @if($article->categories && $article->categories->count() > 0)
    <meta property="article:section" content="{{ $article->categories->first()->name }}">
    @endif
    @if($article->tags && $article->tags->count() > 0)
    @foreach($article->tags as $tag)
    <meta property="article:tag" content="{{ $tag->name }}">
    @endforeach
    @endif
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ url('/articles/' . ($article->slug ?? $article->id)) }}">
    <meta property="twitter:title" content="{{ $article->title }}">
    <meta property="twitter:description" content="{{ $article->excerpt ?? Str::limit(strip_tags($article->content), 150) }}">
    @if($article->featured_image)
    <meta property="twitter:image" content="{{ $article->featured_image }}">
    @endif
    
    <!-- Redirect to React App -->
    <script>
        // Redirect to the React app article page
        window.location.href = "{{ config('app.frontend_url', 'https://laverdadherald.com') }}/article/{{ $article->slug ?? $article->id }}";
    </script>
    
    <!-- Fallback for users with JavaScript disabled -->
    <noscript>
        <meta http-equiv="refresh" content="0; url={{ config('app.frontend_url', 'https://laverdadherald.com') }}/article/{{ $article->slug ?? $article->id }}">
    </noscript>
</head>
<body>
    <!-- Fallback content for crawlers that don't execute JavaScript -->
    <article>
        <h1>{{ $article->title }}</h1>
        @if($article->featured_image)
        <img src="{{ $article->featured_image }}" alt="{{ $article->title }}">
        @endif
        <p><strong>By {{ $article->author_name ?? $article->author->user->name ?? 'La Verdad Herald' }}</strong></p>
        <p><em>Published: {{ $article->published_at ? $article->published_at->format('F j, Y') : '' }}</em></p>
        <div>{!! $article->content !!}</div>
    </article>
    
    <p>Redirecting to <a href="{{ config('app.frontend_url', 'https://laverdadherald.com') }}/article/{{ $article->slug ?? $article->id }}">La Verdad Herald</a>...</p>
</body>
</html>
