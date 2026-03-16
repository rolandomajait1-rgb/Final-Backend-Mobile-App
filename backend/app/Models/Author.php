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
        'bio',
        'website',
        'social_links',
    ];

    protected $appends = ['name'];

    public function getNameAttribute()
    {
        return $this->user?->name ?? 'Unknown Author';
    }

    protected $casts = [
        'social_links' => 'array',
    ];

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
