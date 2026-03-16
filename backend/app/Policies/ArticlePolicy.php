<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ArticlePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can update the model.
     *
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function update(User $user, Article $article)
    {
        // Admins can update any article
        if ($user->isAdmin()) {
            return true;
        }

        // Moderators can only update articles they created or articles in their moderation queue
        if ($user->isModerator()) {
            // For now, restrict to articles they created
            if ($article->author && $article->author->user_id === $user->id) {
                return true;
            }
            return false;
        }

        // Users with author records can update their own articles
        if ($article->author && $article->author->user_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     *
     * @return \Illuminate\Auth\Access\Response|bool
     */
    public function delete(User $user, Article $article)
    {
        return $user->isAdmin();
    }
}
