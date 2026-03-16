<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to La Verdad Herald</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content p { color: #333333; line-height: 1.6; margin: 0 0 20px; }
        .content ul { color: #333333; line-height: 1.8; margin: 20px 0; padding-left: 20px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .footer a { color: #0891b2; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to La Verdad Herald!</h1>
        </div>
        <div class="content">
            <p>Hi{{ $subscriber->name ? ' ' . $subscriber->name : '' }},</p>
            <p>Thank you for subscribing to La Verdad Herald newsletter!</p>
            <p>You'll now receive updates about:</p>
            <ul>
                <li>Latest news and articles from our campus</li>
                <li>Campus events and announcements</li>
                <li>Exclusive content from our writers</li>
                <li>Student achievements and stories</li>
            </ul>
            <p>We're excited to have you as part of our community!</p>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
                Stay connected with La Verdad Christian College through our official publication.
            </p>
        </div>
        <div class="footer">
            <p>If you wish to unsubscribe, <a href="{{ $unsubscribeUrl }}">click here</a>.</p>
            <p style="margin-top: 10px;">© {{ date('Y') }} La Verdad Herald. All rights reserved.</p>
            <p>La Verdad Christian College</p>
        </div>
    </div>
</body>
</html>
