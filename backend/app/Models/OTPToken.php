<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OTPToken extends Model
{
    protected $table = 'otp_tokens';

    protected $fillable = [
        'email',
        'otp',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
