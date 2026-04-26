<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Download La Verdad Herald - Coming Soon</title>
    
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
            padding: 50px 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        
        .logo {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        h1 {
            font-size: 32px;
            color: #1e293b;
            margin-bottom: 16px;
            font-weight: 800;
        }
        
        .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .description {
            font-size: 18px;
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        
        .info-box {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
        }
        
        .info-box h3 {
            font-size: 16px;
            color: #0f172a;
            margin-bottom: 12px;
            font-weight: 700;
        }
        
        .info-box p {
            font-size: 15px;
            color: #475569;
            line-height: 1.6;
            margin: 0;
        }
        
        .btn {
            display: inline-block;
            padding: 16px 40px;
            border-radius: 50px;
            font-size: 17px;
            font-weight: 700;
            text-decoration: none;
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
        
        .footer {
            margin-top: 32px;
            font-size: 14px;
            color: #94a3b8;
        }
        
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 40px 28px;
            }
            
            h1 {
                font-size: 26px;
            }
            
            .description {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="{{ asset('images/logo.png') }}" alt="La Verdad Herald Logo" onerror="this.style.display='none'" />
        </div>
        
        
        <h1>APK Download</h1>
        
        <span class="status-badge">Coming Soon</span>
        
        <p class="description">
            The La Verdad Herald APK is currently being prepared for download.
        </p>
        
        <div class="info-box">
            <h3>🚀 What's Next?</h3>
            <p>
                Our team is building the latest version of the app. Once ready, you'll be able to download and install it directly on your Android device.
            </p>
        </div>
        
        <div class="info-box">
            <h3>💡 In the Meantime</h3>
            <p>
                If you already have the app installed, you can open articles directly using the "Open in App" button on shared articles.
            </p>
        </div>        
        <p class="footer">
            Truth in Every Story
        </p>
    </div>
</body>
</html>
