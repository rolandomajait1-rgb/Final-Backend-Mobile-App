<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        try {
            return collect(Schema::getIndexes($table))->contains('name', $indexName);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function up(): void
    {
        // Add security columns to users
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'password_changed_at')) {
                $table->timestamp('password_changed_at')->nullable()->after('password');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('password_changed_at');
            }
            if (!Schema::hasColumn('users', 'last_login_ip')) {
                $table->string('last_login_ip')->nullable()->after('last_login_at');
            }
        });

        // Add indexes and soft deletes to articles
        Schema::table('articles', function (Blueprint $table) {
            if (!$this->indexExists('articles', 'articles_slug_index')) {
                $table->index('slug');
            }
            if (!$this->indexExists('articles', 'articles_status_index')) {
                $table->index('status');
            }
            if (!$this->indexExists('articles', 'articles_author_id_index')) {
                $table->index('author_id');
            }
            if (!$this->indexExists('articles', 'articles_published_at_index')) {
                $table->index('published_at');
            }
            if (!Schema::hasColumn('articles', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            if (!$this->indexExists('categories', 'categories_name_index')) {
                $table->index('name');
            }
        });

        Schema::table('tags', function (Blueprint $table) {
            if (!$this->indexExists('tags', 'tags_name_index')) {
                $table->index('name');
            }
        });

        if (!Schema::hasTable('login_attempts')) {
            Schema::create('login_attempts', function (Blueprint $table) {
                $table->id();
                $table->string('email');
                $table->string('ip_address');
                $table->boolean('successful')->default(false);
                $table->timestamp('attempted_at');
                $table->index(['email', 'attempted_at']);
                $table->index('ip_address');
            });
        }

        if (!Schema::hasTable('password_histories')) {
            Schema::create('password_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('password');
                $table->timestamp('created_at');
                $table->index(['user_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained();
                $table->string('action');
                $table->string('model_type')->nullable();
                $table->unsignedBigInteger('model_id')->nullable();
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->string('ip_address');
                $table->string('user_agent')->nullable();
                $table->timestamps();
                $table->index(['user_id', 'created_at']);
                $table->index(['model_type', 'model_id']);
                $table->index('action');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(array_filter(
                ['password_changed_at', 'last_login_at', 'last_login_ip'],
                fn($col) => Schema::hasColumn('users', $col)
            ));
        });

        if (Schema::hasTable('articles')) {
            Schema::table('articles', function (Blueprint $table) {
                try { $table->dropIndex(['slug']); } catch (\Exception $e) {}
                try { $table->dropIndex(['status']); } catch (\Exception $e) {}
                try { $table->dropIndex(['author_id']); } catch (\Exception $e) {}
                try { $table->dropIndex(['published_at']); } catch (\Exception $e) {}
                try { $table->dropSoftDeletes(); } catch (\Exception $e) {}
            });
        }

        if (Schema::hasTable('categories')) {
            Schema::table('categories', function (Blueprint $table) {
                try { $table->dropIndex(['name']); } catch (\Exception $e) {}
            });
        }

        if (Schema::hasTable('tags')) {
            Schema::table('tags', function (Blueprint $table) {
                try { $table->dropIndex(['name']); } catch (\Exception $e) {}
            });
        }

        Schema::dropIfExists('login_attempts');
        Schema::dropIfExists('password_histories');
        Schema::dropIfExists('audit_logs');
    }
};
