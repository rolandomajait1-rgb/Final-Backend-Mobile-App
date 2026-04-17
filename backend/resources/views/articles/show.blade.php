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
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            padding: 20px; 
            max-width: 600px; 
            margin: 0 auto; 
            color: #333; 
            line-height: 1.6; 
        }
        .banner { 
            background-color: #f0f9ff; 
            padding: 20px; 
            border-radius: 12px; 
            text-align: center; 
            margin-bottom: 30px; 
            border: 1px solid #bae6fd; 
        }
        .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 5px; }
        .btn-primary { background-color: #0284c7; color: white; }
        .btn-secondary { background-color: white; color: #0f172a; border: 1px solid #cbd5e1; }
        .article-img { width: 100%; border-radius: 12px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="banner">
        <h3 style="margin-top: 0; color: #0369a1; font-size: 20px;">Read on La Verdad Herald App</h3>
        <p style="color: #0c4a6e; margin-bottom: 15px;">Experience fast, offline-ready reading on your Android phone.</p>
        
        <!-- Deep Link to Mobile App -->
        <a href="laverdadherald://article/{{ $article->slug ?? $article->id }}" class="btn btn-primary">📱 Open in App</a>
        
        <!-- Direct APK Download from Backend -->
        <a href="{{ route('download.apk') }}" class="btn btn-secondary">⬇️ Download APK</a>
    </div>

    <article>
        <h1 style="font-size: 28px; line-height: 1.2;">{{ $article->title }}</h1>
        <p style="color: #64748b; font-size: 14px;">By {{ $article->author_name ?? $article->author->user->name ?? 'La Verdad Herald' }} • {{ $article->published_at ? $article->published_at->format('M d, Y') : '' }}</p>
        
        @if($article->featured_image)
        <img src="{{ $article->featured_image }}" alt="{{ $article->title }}" class="article-img">
        @endif
        
        <div style="font-size: 17px; color: #1e293b;">{!! $article->content !!}</div>
    </article>
</body>
</html>
