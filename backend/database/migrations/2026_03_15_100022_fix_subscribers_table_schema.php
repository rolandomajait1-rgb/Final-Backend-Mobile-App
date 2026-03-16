<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if is_active column exists and migrate data
        if (Schema::hasColumn('subscribers', 'is_active')) {
            // Migrate is_active to status
            DB::statement("UPDATE subscribers SET status = CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END WHERE status IS NULL OR status = ''");

            // Drop old column
            Schema::table('subscribers', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }

        // Generate unsubscribe tokens for existing subscribers without one
        $subscribers = DB::table('subscribers')
            ->whereNull('unsubscribe_token')
            ->orWhere('unsubscribe_token', '')
            ->get();

        foreach ($subscribers as $subscriber) {
            DB::table('subscribers')
                ->where('id', $subscriber->id)
                ->update(['unsubscribe_token' => Str::random(64)]);
        }

        // Ensure all subscribers have subscribed_at
        DB::statement('UPDATE subscribers SET subscribed_at = created_at WHERE subscribed_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back is_active column
        if (! Schema::hasColumn('subscribers', 'is_active')) {
            Schema::table('subscribers', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('name');
            });

            // Migrate status back to is_active
            DB::statement("UPDATE subscribers SET is_active = CASE WHEN status = 'active' THEN 1 ELSE 0 END");
        }
    }
};
