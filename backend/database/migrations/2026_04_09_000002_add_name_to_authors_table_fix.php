<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * This migration adds the `name` column back to the authors table.
 * The previous attempt (2026_04_09_000001) failed because it used ->change()
 * which requires doctrine/dbal. This version avoids that.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('authors', 'name')) {
            Schema::table('authors', function (Blueprint $table) {
                $table->string('name')->nullable()->after('id');
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
    }
};
