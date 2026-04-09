<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Author extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',       // ← direct name column (author may not have a user account)
        'bio',
        'website',
        'social_links',
    ];

    protected $casts = [
        'social_links' => 'array',
    ];

    /**
     * Resolve the display name:
     * 1. Use the direct `name` column if set (non-user authors)
     * 2. Fall back to the linked user's name
     * 3. Final fallback: 'Unknown Author'
     */
    public function getNameAttribute(): string
    {
        // Use stored name column first (set from article author_name)
        if (! empty($this->attributes['name'])) {
            return $this->attributes['name'];
        }
        // Fall back to linked user's name
        return $this->user?->name ?? 'Unknown Author';
    }

    protected $appends = ['name'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class);
    }

    public function drafts(): HasMany
    {
        return $this->hasMany(Draft::class);
    }
}
