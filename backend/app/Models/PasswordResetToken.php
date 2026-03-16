<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetToken extends Model
{
    protected $table = 'password_reset_tokens';

    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = 'email';

    protected $keyType = 'string';

    protected $fillable = [
        'email',
        'token',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Scope a query to only include valid tokens (created within 24 hours)
     */
    public function scopeValid($query)
    {
        return $query->where('created_at', '>', now()->subHours(24));
    }

    /**
     * Check if the token is expired (older than 24 hours)
     */
    public function isExpired(): bool
    {
        return $this->created_at->diffInHours(now()) > 24;
    }
}
