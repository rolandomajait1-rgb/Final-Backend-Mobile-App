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
        Schema::table('otp_tokens', function (Blueprint $table) {
            // Add type column as enum with values "email_verification" and "password_reset"
            // Default to "email_verification" for backward compatibility
            $table->enum('type', ['email_verification', 'password_reset'])
                ->default('email_verification')
                ->after('otp');
            
            // Add index on (email, type) for efficient lookups
            $table->index(['email', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('otp_tokens', function (Blueprint $table) {
            $table->dropIndex(['email', 'type']);
            $table->dropColumn('type');
        });
    }
};
