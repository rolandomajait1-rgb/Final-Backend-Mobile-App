<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Rename the 'Health' category to 'Opinion' if Opinion doesn't already exist.
     * If Opinion already exists, just delete the Health record instead.
     */
    public function up(): void
    {
        $health  = DB::table('categories')->where('name', 'Health')->first();
        $opinion = DB::table('categories')->where('name', 'Opinion')->first();

        if (!$health) {
            // Nothing to do — Health category doesn't exist
            return;
        }

        if ($opinion) {
            // Opinion already exists — move any articles linked to Health over to Opinion
            DB::table('article_category')
                ->where('category_id', $health->id)
                ->update(['category_id' => $opinion->id]);

            // Then delete the duplicate Health category
            DB::table('categories')->where('id', $health->id)->delete();
        } else {
            // Opinion doesn't exist — safe to rename Health → Opinion
            DB::table('categories')->where('id', $health->id)->update([
                'name'        => 'Opinion',
                'slug'        => 'opinion',
                'description' => 'Opinion pieces',
            ]);
        }
    }

    /**
     * Rollback: restore Health (best-effort — only if Opinion was renamed from it).
     */
    public function down(): void
    {
        $opinion = DB::table('categories')->where('name', 'Opinion')->where('slug', 'opinion')->first();

        if ($opinion) {
            DB::table('categories')->where('id', $opinion->id)->update([
                'name'        => 'Health',
                'slug'        => 'health',
                'description' => 'Articles about health',
            ]);
        }
    }
};
