<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Safely ensure the `type` column exists on otp_tokens.
     * Uses hasColumn guard so it won't fail if the column already exists
     * (PostgreSQL does not support IF NOT EXISTS on ALTER COLUMN natively in older versions).
     */
    public function up(): void
    {
        if (!Schema::hasColumn('otp_tokens', 'type')) {
            Schema::table('otp_tokens', function (Blueprint $table) {
                $table->string('type')->default('email_verification');
            });

            // Backfill any existing rows that have NULL type
            DB::table('otp_tokens')
                ->whereNull('type')
                ->update(['type' => 'email_verification']);
        }

        // Ensure the composite index exists (safe — will skip if already present)
        try {
            Schema::table('otp_tokens', function (Blueprint $table) {
                $table->index(['email', 'type'], 'otp_tokens_email_type_index');
            });
        } catch (\Throwable $e) {
            // Index already exists — safe to ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only drop if the column exists to avoid errors on rollback
        if (Schema::hasColumn('otp_tokens', 'type')) {
            Schema::table('otp_tokens', function (Blueprint $table) {
                try {
                    $table->dropIndex('otp_tokens_email_type_index');
                } catch (\Throwable $e) {
                    // Index may not exist
                }
                $table->dropColumn('type');
            });
        }
    }
};
