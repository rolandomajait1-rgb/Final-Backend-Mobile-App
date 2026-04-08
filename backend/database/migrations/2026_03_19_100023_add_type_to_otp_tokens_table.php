<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * PostgreSQL-safe: uses hasColumn guard (no ->after() which is MySQL-only).
     */
    public function up(): void
    {
        // Guard: skip if the column already exists (e.g. created by the base migration)
        if (Schema::hasColumn('otp_tokens', 'type')) {
            // Backfill any NULL values just in case
            DB::table('otp_tokens')->whereNull('type')->update(['type' => 'email_verification']);

            // Ensure the composite index exists
            try {
                Schema::table('otp_tokens', function (Blueprint $table) {
                    $table->index(['email', 'type'], 'otp_tokens_email_type_idx');
                });
            } catch (\Throwable $e) {
                // Index already exists — safe to ignore
            }

            return;
        }

        Schema::table('otp_tokens', function (Blueprint $table) {
            // Use string instead of enum for broader DB compatibility
            // No ->after() — PostgreSQL does not support column ordering
            $table->string('type')->default('email_verification');
            $table->index(['email', 'type'], 'otp_tokens_email_type_idx');
        });

        // Backfill any existing rows with NULL type
        DB::table('otp_tokens')->whereNull('type')->update(['type' => 'email_verification']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('otp_tokens', 'type')) {
            return;
        }

        Schema::table('otp_tokens', function (Blueprint $table) {
            try {
                $table->dropIndex('otp_tokens_email_type_idx');
            } catch (\Throwable $e) {
                // Index may not exist
            }
            $table->dropColumn('type');
        });
    }
};
