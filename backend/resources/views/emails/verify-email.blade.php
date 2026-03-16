<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content p { color: #333333; line-height: 1.6; margin: 0 0 20px; }
        .button { display: inline-block; padding: 14px 32px; background: #0891b2; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #0e7490; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .link { color: #0891b2; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Verify Your Email</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{ $user->name }}</strong>,</p>
            <p>Welcome to <strong>La Verdad Herald</strong>! We're excited to have you on board.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
                <a href="{{ $verificationUrl }}" class="button">Verify Email Address</a>
            </div>
            <p style="margin-top: 30px; color: #ef4444;"><strong>⏰ This link will expire in 24 hours.</strong></p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>© {{ date('Y') }} La Verdad Herald. All rights reserved.</p>
            <p>La Verdad Christian College</p>
        </div>
    </div>
</body>
</html>
