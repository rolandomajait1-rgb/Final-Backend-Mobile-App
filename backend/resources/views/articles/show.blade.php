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
        .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: bold; 
            margin: 5px;
            transition: all 0.3s ease;
        }
        .btn-primary { 
            background-color: #0284c7; 
            color: white; 
        }
        .btn-primary:hover {
            background-color: #0369a1;
            transform: translateY(-2px);
        }
        .btn-secondary { 
            background-color: white; 
            color: #0f172a; 
            border: 1px solid #cbd5e1; 
        }
        .btn-secondary:hover {
            background-color: #f8fafc;
        }
        .article-img { 
            width: 100%; 
            border-radius: 12px; 
            margin-bottom: 20px; 
        }
        .content-preview {
            position: relative;
            max-height: 400px;
            overflow: hidden;
            margin-bottom: 30px;
        }
        .content-preview::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            background: linear-gradient(to bottom, transparent, white);
        }
        .content-teaser {
            font-size: 17px;
            color: #1e293b;
            line-height: 1.8;
        }
        .unlock-banner {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 40px 30px;
            border-radius: 16px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(14, 165, 233, 0.3);
        }
        .unlock-banner h2 {
            margin: 0 0 12px 0;
            font-size: 24px;
        }
        .unlock-banner p {
            margin: 0 0 24px 0;
            opacity: 0.95;
            font-size: 16px;
        }
        .unlock-banner .btn {
            background: white;
            color: #0284c7;
            font-size: 16px;
            padding: 14px 32px;
        }
        .unlock-banner .btn:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="banner">
        <div style="width: 60px; height: 60px; margin: 0 auto 15px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img src="{{ asset('images/logo.svg') }}" alt="La Verdad Herald Logo" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
        </div>
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
        
        <!-- Content Preview (Limited to ~300 characters) -->
        <div class="content-preview">
            <div class="content-teaser">
                {!! Str::limit(strip_tags($article->content), 200, '...') !!}
            </div>
        </div>
        
        <!-- Unlock Full Article Banner -->
        <div class="unlock-banner">
            <h2>🔒 Continue Reading</h2>
            <p>Download the La Verdad Herald app to read the full article and access exclusive content.</p>
            <a href="laverdadherald://article/{{ $article->slug ?? $article->id }}" class="btn">
                📱 Open in App
            </a>
        </div>
        
        <!-- Related Articles Teaser -->
        @if(isset($related) && $related->count() > 0)
        <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0;">
            <h3 style="color: #0f172a; margin-bottom: 20px;">Related Articles</h3>
            @foreach($related as $relatedArticle)
            <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <h4 style="margin: 0 0 8px 0; font-size: 16px;">
                    <a href="{{ route('article.web', $relatedArticle->slug) }}" style="color: #0369a1; text-decoration: none;">
                        {{ $relatedArticle->title }}
                    </a>
                </h4>
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                    By {{ $relatedArticle->author->user->name ?? 'La Verdad Herald' }} • 
                    {{ $relatedArticle->published_at ? $relatedArticle->published_at->format('M d, Y') : '' }}
                </p>
            </div>
            @endforeach
        </div>
        @endif
    </article>
</body>
</html>
