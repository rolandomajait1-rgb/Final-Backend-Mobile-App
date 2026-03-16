<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>La Verdad Herald Newsletter</title>
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .content { padding: 40px 30px; }
        .content p { color: #333333; line-height: 1.6; margin: 0 0 15px; }
        .content h2 { color: #0891b2; margin: 25px 0 15px; }
        .content h3 { color: #333333; margin: 20px 0 10px; }
        .content ul, .content ol { color: #333333; line-height: 1.6; margin: 15px 0; padding-left: 20px; }
        .content a { color: #0891b2; text-decoration: none; }
        .content a:hover { text-decoration: underline; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .footer a { color: #0891b2; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 La Verdad Herald</h1>
        </div>
        <div class="content">
            {!! $content !!}
        </div>
        <div class="footer">
            <p><a href="{{ $unsubscribeUrl }}">Unsubscribe</a> from this newsletter</p>
            <p style="margin-top: 10px;">© {{ date('Y') }} La Verdad Herald. All rights reserved.</p>
            <p>La Verdad Christian College</p>
        </div>
    </div>
</body>
</html>
