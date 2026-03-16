<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticleInteraction extends Model
{
    use HasFactory;

    protected $table = 'article_user_interactions';

    protected $fillable = [
        'user_id',
        'article_id',
        'type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}
