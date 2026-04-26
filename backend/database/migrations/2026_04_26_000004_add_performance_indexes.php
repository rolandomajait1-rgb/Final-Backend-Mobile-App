<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add composite index for article_user_interactions (frequently queried together)
        Schema::table('article_user_interactions', function (Blueprint $table) {
            // For queries: WHERE user_id = ? AND article_id = ? AND type = ?
            $table->index(['user_id', 'article_id', 'type'], 'idx_interactions_user_article_type');
            
            // For queries: WHERE article_id = ? AND type = ?
            $table->index(['article_id', 'type'], 'idx_interactions_article_type');
        });

        // Add index for articles status and published_at (for filtering published articles)
        Schema::table('articles', function (Blueprint $table) {
            // For queries: WHERE status = 'published' ORDER BY published_at DESC
            $table->index(['status', 'published_at'], 'idx_articles_status_published');
        });

        // Add index for logs model_type and model_id (for audit log queries)
        Schema::table('logs', function (Blueprint $table) {
            // For queries: WHERE model_type = ? AND model_id = ?
            $table->index(['model_type', 'model_id'], 'idx_logs_model');
        });

        // Add index for contact_submissions type and created_at (for filtering by type)
        if (Schema::hasTable('contact_submissions')) {
            Schema::table('contact_submissions', function (Blueprint $table) {
                $table->index(['type', 'created_at'], 'idx_contact_type_created');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('article_user_interactions', function (Blueprint $table) {
            $table->dropIndex('idx_interactions_user_article_type');
            $table->dropIndex('idx_interactions_article_type');
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex('idx_articles_status_published');
        });

        Schema::table('logs', function (Blueprint $table) {
            $table->dropIndex('idx_logs_model');
        });

        if (Schema::hasTable('contact_submissions')) {
            Schema::table('contact_submissions', function (Blueprint $table) {
                $table->dropIndex('idx_contact_type_created');
            });
        }
    }
};
