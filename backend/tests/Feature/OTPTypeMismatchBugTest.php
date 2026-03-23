<?php

namespace Tests\Feature;

use App\Models\OTPToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Bug Condition Exploration Test - OTP Type Mismatch Detection
 * 
 * This test demonstrates the bug where OTPs can be misused across different purposes.
 * On unfixed code, this test MUST FAIL - proving the bug exists.
 * On fixed code, this test MUST PASS - proving the bug is fixed.
 * 
 * Validates: Requirements 2.1, 2.2, 2.5, 2.6
 */
class OTPTypeMismatchBugTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Bug Condition: Email verification OTP can be used for password reset on unfixed code
     * 
     * This test demonstrates that on unfixed code, an OTP generated for email verification
     * can be misused to reset a password, which should not be allowed.
     * 
     * Expected on unfixed code: TEST FAILS (OTP is accepted for password reset)
     * Expected on fixed code: TEST PASSES (OTP is rejected for password reset)
     */
    public function test_email_verification_otp_cannot_be_used_for_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create(['email' => $email]);
        
        // Generate email verification OTP (simulating registration flow)
        $emailVerificationOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $emailVerificationOtp,
            'type' => OTPToken::TYPE_EMAIL_VERIFICATION,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt to use email verification OTP for password reset
        // On unfixed code: This will succeed (BUG!)
        // On fixed code: This will fail (CORRECT!)
        $response = $this->postJson('/api/verify-otp', [
            'email' => $email,
            'otp' => $emailVerificationOtp,
        ]);
        
        // This assertion MUST FAIL on unfixed code (proving the bug exists)
        // This assertion MUST PASS on fixed code (proving the bug is fixed)
        $response->assertStatus(400)
            ->assertJsonFragment(['message' => 'OTP type mismatch']);
    }

    /**
     * Bug Condition: Password reset OTP can be used for email verification on unfixed code
     * 
     * This test demonstrates that on unfixed code, an OTP generated for password reset
     * can be misused to verify an email, which should not be allowed.
     * 
     * Expected on unfixed code: TEST FAILS (OTP is accepted for email verification)
     * Expected on fixed code: TEST PASSES (OTP is rejected for email verification)
     */
    public function test_password_reset_otp_cannot_be_used_for_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create(['email' => $email]);
        
        // Generate password reset OTP (simulating password reset flow)
        $passwordResetOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $passwordResetOtp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt to use password reset OTP for email verification
        // On unfixed code: This will succeed (BUG!)
        // On fixed code: This will fail (CORRECT!)
        $response = $this->postJson('/api/verify-registration-otp', [
            'email' => $email,
            'otp' => $passwordResetOtp,
        ]);
        
        // This assertion MUST FAIL on unfixed code (proving the bug exists)
        // This assertion MUST PASS on fixed code (proving the bug is fixed)
        $response->assertStatus(400)
            ->assertJsonFragment(['message' => 'OTP type mismatch']);
    }

    /**
     * Counterexample 1: Email verification OTP can be used for password reset on unfixed code
     * 
     * This test directly verifies the bug at the service level.
     * On unfixed code: verifyOTP() accepts email verification OTP (BUG!)
     * On fixed code: verifyOTP() rejects email verification OTP (CORRECT!)
     */
    public function test_service_email_verification_otp_rejected_for_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        User::factory()->create(['email' => $email]);
        
        // Generate email verification OTP with correct type
        $emailVerificationOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $emailVerificationOtp,
            'type' => OTPToken::TYPE_EMAIL_VERIFICATION,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Get the AuthService
        $authService = app(\App\Services\AuthService::class);
        
        // Attempt to verify email verification OTP as password reset OTP
        // On unfixed code: This will succeed (BUG!)
        // On fixed code: This will fail (CORRECT!)
        $result = $authService->verifyOTP($email, $emailVerificationOtp);
        
        // This assertion MUST FAIL on unfixed code (proving the bug exists)
        // This assertion MUST PASS on fixed code (proving the bug is fixed)
        $this->assertFalse($result['success'], 
            'Email verification OTP should not be usable for password reset. ' .
            'Counterexample: Email verification OTP can be used for password reset on unfixed code'
        );
        $this->assertStringContainsString('type', strtolower($result['message']),
            'Error message should mention OTP type mismatch'
        );
    }

    /**
     * Counterexample 2: Password reset OTP can be used for email verification on unfixed code
     * 
     * This test directly verifies the bug at the service level.
     * On unfixed code: verifyRegistrationOTP() accepts password reset OTP (BUG!)
     * On fixed code: verifyRegistrationOTP() rejects password reset OTP (CORRECT!)
     */
    public function test_service_password_reset_otp_rejected_for_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        User::factory()->create(['email' => $email]);
        
        // Generate password reset OTP with correct type
        $passwordResetOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $passwordResetOtp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Get the AuthService
        $authService = app(\App\Services\AuthService::class);
        
        // Attempt to verify password reset OTP as email verification OTP
        // On unfixed code: This will succeed (BUG!)
        // On fixed code: This will fail (CORRECT!)
        $result = $authService->verifyRegistrationOTP($email, $passwordResetOtp);
        
        // This assertion MUST FAIL on unfixed code (proving the bug exists)
        // This assertion MUST PASS on fixed code (proving the bug is fixed)
        $this->assertFalse($result['success'],
            'Password reset OTP should not be usable for email verification. ' .
            'Counterexample: Password reset OTP can be used for email verification on unfixed code'
        );
        $this->assertStringContainsString('type', strtolower($result['message']),
            'Error message should mention OTP type mismatch'
        );
    }
}
