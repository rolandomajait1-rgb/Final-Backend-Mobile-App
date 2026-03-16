<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification Pending - La Verdad Herald</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; width: 100%; padding: 40px; text-align: center; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #333; font-size: 28px; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; margin-bottom: 24px; font-size: 16px; }
        .email-box { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #0891b2; }
        .email-box strong { color: #0891b2; }
        .button { display: inline-block; background: #0891b2; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.3s; margin-top: 16px; }
        .button:hover { background: #0e7490; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
        .alert { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; padding: 12px; border-radius: 8px; margin-bottom: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📧</div>
        <h1>Check Your Email</h1>
        
        @if(session('success'))
            <div class="alert">{{ session('success') }}</div>
        @endif
        
        <p>We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.</p>
        
        <div class="email-box">
            <p><strong>Didn't receive the email?</strong></p>
            <p style="margin: 0; font-size: 14px;">Check your spam folder or request a new verification link.</p>
        </div>
        
        <p style="font-size: 14px; color: #ef4444;">⏰ The verification link will expire in 24 hours.</p>
        
        <a href="/login" class="button">Go to Login</a>
        
        <div class="footer">
            <p>© {{ date('Y') }} La Verdad Herald</p>
            <p>La Verdad Christian College</p>
        </div>
    </div>
</body>
</html>
