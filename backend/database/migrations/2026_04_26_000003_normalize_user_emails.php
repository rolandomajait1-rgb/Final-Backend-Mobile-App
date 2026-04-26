<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normalize all existing user emails to lowercase
        DB::statement('UPDATE users SET email = LOWER(email)');
        
        // Normalize all existing OTP token emails to lowercase
        if (Schema::hasTable('otp_tokens')) {
            DB::statement('UPDATE otp_tokens SET email = LOWER(email)');
        }
        
        // Normalize all existing password reset token emails to lowercase
        if (Schema::hasTable('password_reset_tokens')) {
            DB::statement('UPDATE password_reset_tokens SET email = LOWER(email)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse - lowercase emails are valid
    }
};
