<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Re-add 'name' to authors so authors can exist without a user account
        if (! Schema::hasColumn('authors', 'name')) {
            Schema::table('authors', function (Blueprint $table) {
                $table->string('name')->nullable()->after('id');
            });
        }

        // Make articles.author_id nullable so an article can exist
        // even if the author record is temporarily missing
        if (Schema::hasColumn('articles', 'author_id')) {
            Schema::table('articles', function (Blueprint $table) {
                // Drop the existing foreign key constraint first
                $table->dropForeign(['author_id']);
                // Re-add as nullable with cascade
                $table->foreignId('author_id')->nullable()->change();
                $table->foreign('author_id')->references('id')->on('authors')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('authors', 'name')) {
            Schema::table('authors', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->dropForeign(['author_id']);
            $table->foreignId('author_id')->nullable(false)->change();
            $table->foreign('author_id')->references('id')->on('authors')->onDelete('cascade');
        });
    }
};
