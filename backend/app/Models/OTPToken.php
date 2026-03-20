<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OTPToken extends Model
{
    protected $table = 'otp_tokens';

    // OTP type constants
    public const TYPE_EMAIL_VERIFICATION = 'email_verification';
    public const TYPE_PASSWORD_RESET = 'password_reset';

    protected $fillable = [
        'email',
        'otp',
        'type',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'type' => 'string',
    ];
}
