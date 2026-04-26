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
    
    <title>{{ e($article->title) }} - La Verdad Herald</title>
    
    <!-- Open Graph Meta Tags for Social Sharing -->
    <meta property="og:title" content="{{ e($article->title) }}" />
    <meta property="og:description" content="{{ e(Str::limit(strip_tags($article->content), 150)) }}" />
    <meta property="og:image" content="{{ e($article->featured_image_url ?? asset('images/default-article.jpg')) }}" />
    <meta property="og:url" content="{{ e(url()->current()) }}" />
    <meta property="og:type" content="article" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{{ e($article->title) }}" />
    <meta name="twitter:description" content="{{ e(Str::limit(strip_tags($article->content), 150)) }}" />
    <meta name="twitter:image" content="{{ e($article->featured_image_url ?? asset('images/default-article.jpg')) }}" />
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #2C5F7F 0%, #1e3a52 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            max-width: 500px;
            width: 100%;
            background: white;
            border-radius: 24px;
            padding: 40px 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        
        .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 24px;
            border-radius: 50%;
            background: #f8b200;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            color: white;
            font-weight: bold;
        }
        
        h1 {
            font-size: 28px;
            color: #1e293b;
            margin-bottom: 12px;
            font-weight: 800;
        }
        
        .article-title {
            font-size: 18px;
            color: #475569;
            margin-bottom: 24px;
            line-height: 1.6;
            font-weight: 600;
        }
        
        .description {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        
        .buttons {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .btn {
            padding: 16px 32px;
            border-radius: 50px;
            font-size: 17px;
            font-weight: 700;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .btn-primary {
            background: #0ea5e9;
            color: white;
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }
        
        .btn-primary:hover {
            background: #0284c7;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
        }
        
        .btn-secondary {
            background: #f1f5f9;
            color: #475569;
        }
        
        .btn-secondary:hover {
            background: #e2e8f0;
        }
        
        .footer {
            margin-top: 24px;
            font-size: 14px;
            color: #94a3b8;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 32px 24px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .article-title {
                font-size: 16px;
            }
        }
    </style>
    
    <script>
        // Security: Prevent XSS and injection attacks
        (function() {
            'use strict';
            
            // Sanitize slug to prevent XSS
            const articleSlug = '{{ e($article->slug) }}';
            
            // Validate slug format
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(articleSlug)) {
                console.error('Invalid article slug');
                return;
            }
            
            // Try to open the app using deep link
            window.openInApp = function() {
                const deepLink = 'laverdadherald://article/' + encodeURIComponent(articleSlug);
                const appStoreLink = 'https://apps.apple.com/app/laverdad-herald'; // Replace with actual link
                const playStoreLink = 'https://play.google.com/store/apps/details?id=com.landzki.laverdadherald';
                
                // Try to open the app
                window.location.href = deepLink;
                
                // If app is not installed, redirect to store after a delay
                setTimeout(function() {
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    const isAndroid = /Android/.test(navigator.userAgent);
                    
                    if (isIOS) {
                        window.location.href = appStoreLink;
                    } else if (isAndroid) {
                        window.location.href = playStoreLink;
                    }
                }, 2000);
                
                return false;
            };
        })();
    </script>
</head>
<body>
    <div class="container">
        <div class="logo">LV</div>
        <h1>La Verdad Herald</h1>
        <p class="article-title">"{{ e($article->title) }}"</p>
        <p class="description">
            Get the full experience by opening this article in the La Verdad Herald app.
        </p>
        
        <div class="buttons">
            <a href="#" onclick="return openInApp();" class="btn btn-primary">
                Open in App
            </a>
            <a href="{{ e(route('article.web', $article->slug)) }}" class="btn btn-secondary">
                Read on Web
            </a>
        </div>
        
        <p class="footer">
            Truth in Every Story
        </p>
    </div>
</body>
</html>
