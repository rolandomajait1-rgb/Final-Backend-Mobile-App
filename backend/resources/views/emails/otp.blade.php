<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Password Reset OTP</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0891b2;">Password Reset OTP</h2>
        <p>Hi {{ $user->name }},</p>
        <p>We received a request to reset your password for your La Verdad Herald account.</p>
        <p>Use the following 6-digit code to verify your identity:</p>
        <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                <p style="font-size: 32px; font-weight: bold; color: #0891b2; letter-spacing: 8px; margin: 0;">{{ $otp }}</p>
            </div>
        </div>
        <p><strong>This code will expire in 10 minutes.</strong></p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
            This is an automated email from La Verdad Herald. Please do not reply to this email.
        </p>
    </div>
</body>
</html>
