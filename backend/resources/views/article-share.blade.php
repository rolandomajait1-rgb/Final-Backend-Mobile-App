<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    
    <!-- Security Headers -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:;">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    
    <title>{{ $article->title }} - La Verdad Herald</title>
    
    <!-- Open Graph Meta Tags for Social Sharing -->
    <meta property="og:site_name" content="La Verdad Herald" />
    <meta property="og:title" content="{{ $article->title }}" />
    <meta property="og:description" content="Read this article on La Verdad Herald app - {{ Str::limit(strip_tags($article->content), 100) }}" />
    <meta property="og:image" content="{{ $article->featured_image_url }}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@laverdadherald" />
    <meta name="twitter:title" content="{{ $article->title }}" />
    <meta name="twitter:description" content="Read this article on La Verdad Herald app" />
    <meta name="twitter:image" content="{{ $article->featured_image_url }}" />
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #006d9fff 0%, #006293ff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .card {
            max-width: 480px;
            width: 100%;
            background: white;
            border-radius: 20px;
            padding: 48px 32px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            text-align: center;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #f0f9ff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        h1 {
            font-size: 24px;
            color: #0f172a;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        .tagline {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 24px;
            font-weight: 500;
        }
        
        .article-title {
            font-size: 17px;
            color: #334155;
            margin-bottom: 12px;
            line-height: 1.5;
            font-weight: 600;
        }
        
        .description {
            font-size: 15px;
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.5;
        }
        
        .btn {
            width: 100%;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            display: block;
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
            margin-bottom: 12px;
        }
        
        .btn-primary {
            background: #006fa2ff;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0284c7;
            transform: translateY(-1px);
        }
        
        .btn-secondary {
            background: #f1f5f9;
            color: #475569;
        }
        
        .btn-secondary:hover {
            background: #e2e8f0;
        }
        
        @media (max-width: 480px) {
            .card {
                padding: 40px 24px;
            }
            
            h1 {
                font-size: 22px;
            }
            
            .article-title {
                font-size: 16px;
            }
        }
    </style>
    
    <script>
        window.openInApp = function() {
            const slug = '{{ $article->slug }}';
            const deepLink = 'laverdadherald://article/' + encodeURIComponent(slug);
            window.location.href = deepLink;
            
            setTimeout(function() {
                if (/Android/.test(navigator.userAgent)) {
                    window.location.href = 'https://play.google.com/store/apps/details?id=com.landzki.laverdadherald';
                }
            }, 1500);
            
            return false;
        };
    </script>
</head>
<body>
    <div class="card">
       <div class="logo">
            <img src="{{ \App\Helpers\ImageHelper::getLogoDataUri() }}" alt="La Verdad Herald Logo" onerror="this.style.display='none'" />
        </div>
        
        
        <h1>La Verdad Herald</h1>
        <p class="tagline">Truth in Every Story</p>
        
        <p class="article-title">{{ $article->title }}</p>
        <p class="description">Open this article in the La Verdad Herald app for the best reading experience.</p>
        
        <a href="#" onclick="return openInApp();" class="btn btn-primary">
            📱 Open in App
        </a>
        <a href="{{ route('download.apk') }}" class="btn btn-secondary">
            ⬇️ Download APK
        </a>
    </div>
</body>
</html>
