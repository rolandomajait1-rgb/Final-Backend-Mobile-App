<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Safely add an index only if it doesn't already exist.
     */
    private function addIndexIfNotExists(string $table, array|string $columns, string $indexName): void
    {
        try {
            $columns = is_array($columns) ? $columns : [$columns];
            // Check all columns exist
            foreach ($columns as $col) {
                if (!Schema::hasColumn($table, $col)) {
                    return;
                }
            }
            // Check index doesn't already exist
            $exists = collect(Schema::getIndexes($table))->contains('name', $indexName);
            if ($exists) {
                return;
            }
            Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                $table->index($columns, $indexName);
            });
        } catch (\Exception $e) {
            // Skip if index already exists or column missing
        }
    }

    public function up(): void
    {
        $this->addIndexIfNotExists('articles', 'published_at', 'idx_articles_published_at');
        $this->addIndexIfNotExists('articles', 'status', 'idx_articles_status');
        $this->addIndexIfNotExists('articles', ['author_id', 'status'], 'idx_articles_author_status');
        $this->addIndexIfNotExists('articles', 'view_count', 'idx_articles_view_count');

        $this->addIndexIfNotExists('article_category', 'article_id', 'idx_article_category_article');
        $this->addIndexIfNotExists('article_category', 'category_id', 'idx_article_category_category');

        $this->addIndexIfNotExists('article_tag', 'article_id', 'idx_article_tag_article');
        $this->addIndexIfNotExists('article_tag', 'tag_id', 'idx_article_tag_tag');

        $this->addIndexIfNotExists('article_user_interactions', ['article_id', 'type'], 'idx_article_interactions_article_type');
        $this->addIndexIfNotExists('article_user_interactions', ['user_id', 'type'], 'idx_article_interactions_user_type');

        $this->addIndexIfNotExists('subscribers', 'status', 'idx_subscribers_status');
        $this->addIndexIfNotExists('subscribers', 'subscribed_at', 'idx_subscribers_subscribed_at');

        $this->addIndexIfNotExists('sessions', 'last_activity', 'idx_sessions_last_activity');
    }

    public function down(): void
    {
        $drops = [
            'articles' => ['idx_articles_published_at', 'idx_articles_status', 'idx_articles_author_status', 'idx_articles_view_count'],
            'article_category' => ['idx_article_category_article', 'idx_article_category_category'],
            'article_tag' => ['idx_article_tag_article', 'idx_article_tag_tag'],
            'article_user_interactions' => ['idx_article_interactions_article_type', 'idx_article_interactions_user_type'],
            'subscribers' => ['idx_subscribers_status', 'idx_subscribers_subscribed_at'],
            'sessions' => ['idx_sessions_last_activity'],
        ];

        foreach ($drops as $table => $indexes) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            foreach ($indexes as $index) {
                try {
                    Schema::table($table, function (Blueprint $t) use ($index) {
                        $t->dropIndex($index);
                    });
                } catch (\Exception $e) {
                    // Index may not exist, skip
                }
            }
        }
    }
};
