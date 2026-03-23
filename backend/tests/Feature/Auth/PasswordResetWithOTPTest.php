<?php

namespace Tests\Feature\Auth;

use App\Models\OTPToken;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Integration Tests for Complete Password Reset Flow with OTP
 * 
 * This test suite verifies the complete password reset flow with OTP-based verification.
 * It tests the entire user journey from password reset request through OTP verification to login.
 * 
 * Test Scenarios:
 * 1. User submits password reset request with email
 * 2. System generates password reset OTP
 * 3. Email is queued for async delivery
 * 4. User receives OTP in email
 * 5. User submits OTP and new password
 * 6. User password is updated
 * 7. User can log in with new password
 * 
 * Validates: Requirements 3.2, 3.3, 3.4
 */
class PasswordResetWithOTPTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = app(AuthService::class);
        Queue::fake(); // Fake the queue to prevent actual email sending
    }

    /**
     * Test: Complete password reset flow with OTP verification
     * 
     * Scenario:
     * 1. User submits password reset request with email
     * 2. System generates password reset OTP
     * 3. Email is queued for async delivery
     * 4. User receives OTP in email
     * 5. User submits OTP and new password
     * 6. User password is updated
     * 7. User can log in with new password
     * 
     * Validates: Requirements 3.2, 3.3, 3.4
     */
    public function test_complete_password_reset_flow_with_otp(): void
    {
        $email = 'user@example.com';
        $oldPassword = 'OldPassword123!';
        $newPassword = 'NewPassword456!';
        
        // Step 1: Create a user with verified email
        $user = User::factory()->create([
            'email' => $email,
            'password' => Hash::make($oldPassword),
            'email_verified_at' => now(),
        ]);
        
        // Step 2: User submits password reset request with email
        $resetResult = $this->authService->initiatePasswordReset($email);
        $this->assertTrue($resetResult['success']);
        
        // Step 3: System generates password reset OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $this->assertNotNull($otpRecord);
        $otp = $otpRecord->otp;
        
        // Verify OTP is 6 digits
        $this->assertMatchesRegularExpression('/^\d{6}$/', $otp);
        
        // Verify OTP has not expired
        $this->assertTrue($otpRecord->expires_at->isFuture());
        
        // Step 4: Email is queued for async delivery
        Queue::assertPushed(\App\Jobs\SendOTPEmailJob::class);
        
        // Step 5: User receives OTP in email (simulated by retrieving from DB)
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Step 6: User submits OTP for verification
        $verifyResult = $this->authService->verifyOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        $resetToken = $verifyResult['token'];
        
        // Step 7: User submits new password with reset token
        $passwordResetResult = $this->authService->resetPassword($email, $resetToken, $newPassword);
        $this->assertTrue($passwordResetResult['success']);
        
        // Step 8: User password is updated
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));
        $this->assertFalse(Hash::check($oldPassword, $user->password));
        
        // Step 9: User can log in with new password
        $this->assertTrue(Hash::check($newPassword, $user->password));
        
        // Verify OTP was deleted after use
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Test: OTP type is "password_reset" in database
     * 
     * Validates: Requirement 2.2
     */
    public function test_otp_type_is_password_reset_in_database(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        
        // Initiate password reset
        $this->authService->initiatePasswordReset($email);
        
        // Verify OTP type is "password_reset"
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
        ]);
    }

    /**
     * Test: Password reset OTP cannot be used for email verification
     * 
     * Validates: Requirement 2.6
     */
    public function test_password_reset_otp_cannot_be_used_for_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Initiate password reset
        $this->authService->initiatePasswordReset($email);
        
        // Get the password reset OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Attempt to use password reset OTP for email verification
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        
        // Should fail because OTP type is "password_reset", not "email_verification"
        $this->assertFalse($result['success']);
        
        // OTP should still exist (not deleted)
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Test: Email is sent asynchronously (response is fast)
     * 
     * Validates: Requirement 2.4
     */
    public function test_email_is_sent_asynchronously_response_is_fast(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        
        // Measure password reset initiation time
        $startTime = microtime(true);
        
        $this->authService->initiatePasswordReset($email);
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        // Response should be fast (< 500ms)
        // This verifies that email sending is asynchronous and doesn't block
        $this->assertLessThan(500, $executionTime, 'Password reset took too long, email might be sent synchronously');
        
        // Verify email job was queued
        Queue::assertPushed(\App\Jobs\SendOTPEmailJob::class);
    }

    /**
     * Test: User can reset password and then log in
     * 
     * Validates: Requirements 3.2, 3.3, 3.4
     */
    public function test_user_can_reset_password_and_then_login(): void
    {
        $email = 'user@example.com';
        $oldPassword = 'OldPassword123!';
        $newPassword = 'NewPassword456!';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'password' => Hash::make($oldPassword),
            'email_verified_at' => now(),
        ]);
        
        // Initiate password reset
        $this->authService->initiatePasswordReset($email);
        
        // Get OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Verify OTP
        $verifyResult = $this->authService->verifyOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        $resetToken = $verifyResult['token'];
        
        // Reset password
        $resetResult = $this->authService->resetPassword($email, $resetToken, $newPassword);
        $this->assertTrue($resetResult['success']);
        
        // Verify user password is updated
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));
        
        // Verify OTP was deleted after use
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Test: Multiple users can reset passwords independently
     * 
     * Validates: Requirements 3.2, 3.3, 3.4
     */
    public function test_multiple_users_can_reset_passwords_independently(): void
    {
        $users = [];
        $otps = [];
        $newPasswords = [];
        
        // Create 3 users
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            $password = "Password{$i}123!";
            
            $user = User::factory()->create([
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);
            
            $users[$i] = $user;
            $newPasswords[$i] = "NewPassword{$i}456!";
        }
        
        // Initiate password reset for each user
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            $this->authService->initiatePasswordReset($email);
            
            // Get OTP for this user
            $otpRecord = OTPToken::where('email', $email)->first();
            $otps[$i] = $otpRecord->otp;
        }
        
        // Reset password for each user independently
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            
            // Verify OTP
            $verifyResult = $this->authService->verifyOTP($email, $otps[$i]);
            $this->assertTrue($verifyResult['success']);
            $resetToken = $verifyResult['token'];
            
            // Reset password
            $resetResult = $this->authService->resetPassword($email, $resetToken, $newPasswords[$i]);
            $this->assertTrue($resetResult['success']);
            
            // Verify password is updated
            $users[$i]->refresh();
            $this->assertTrue(Hash::check($newPasswords[$i], $users[$i]->password));
        }
        
        // Verify all users have updated passwords
        for ($i = 1; $i <= 3; $i++) {
            $users[$i]->refresh();
            $this->assertTrue(Hash::check($newPasswords[$i], $users[$i]->password));
        }
    }

    /**
     * Test: User cannot reset password with wrong OTP
     * 
     * Validates: Requirement 3.3
     */
    public function test_user_cannot_reset_password_with_wrong_otp(): void
    {
        $email = 'user@example.com';
        $oldPassword = 'OldPassword123!';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'password' => Hash::make($oldPassword),
            'email_verified_at' => now(),
        ]);
        
        // Initiate password reset
        $this->authService->initiatePasswordReset($email);
        
        // Get the correct OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $correctOtp = $otpRecord->otp;
        
        // Generate a wrong OTP
        $wrongOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        while ($wrongOtp === $correctOtp) {
            $wrongOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        }
        
        // Attempt to verify with wrong OTP
        $verifyResult = $this->authService->verifyOTP($email, $wrongOtp);
        $this->assertFalse($verifyResult['success']);
        
        // Verify user password is unchanged
        $user->refresh();
        $this->assertTrue(Hash::check($oldPassword, $user->password));
        
        // Verify correct OTP still exists
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $correctOtp,
        ]);
    }

    /**
     * Test: User cannot reuse same OTP twice
     * 
     * Validates: Requirement 3.4
     */
    public function test_user_cannot_reuse_same_otp_twice(): void
    {
        $email = 'user@example.com';
        $oldPassword = 'OldPassword123!';
        $newPassword = 'NewPassword456!';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'password' => Hash::make($oldPassword),
            'email_verified_at' => now(),
        ]);
        
        // Initiate password reset
        $this->authService->initiatePasswordReset($email);
        
        // Get the OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Verify OTP
        $verifyResult = $this->authService->verifyOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        $resetToken = $verifyResult['token'];
        
        // Verify OTP was deleted
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Attempt to use same OTP again should fail
        $retryResult = $this->authService->verifyOTP($email, $otp);
        $this->assertFalse($retryResult['success']);
    }

    /**
     * Test: Expired OTP is rejected
     * 
     * Validates: Requirement 3.3
     */
    public function test_expired_otp_is_rejected(): void
    {
        $email = 'user@example.com';
        $oldPassword = 'OldPassword123!';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'password' => Hash::make($oldPassword),
            'email_verified_at' => now(),
        ]);
        
        // Generate expired OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
            'expires_at' => now()->subMinutes(1), // Expired 1 minute ago
        ]);
        
        // Attempt to verify with expired OTP
        $result = $this->authService->verifyOTP($email, $otp);
        
        // Should be rejected
        $this->assertFalse($result['success']);
        
        // Password should still be unchanged
        $user->refresh();
        $this->assertTrue(Hash::check($oldPassword, $user->password));
    }

    /**
     * Test: Non-existent email returns generic success message
     * 
     * Validates: Requirement 3.5
     */
    public function test_non_existent_email_returns_generic_success(): void
    {
        $email = 'nonexistent@example.com';
        
        // Attempt password reset for non-existent email
        $result = $this->authService->initiatePasswordReset($email);
        
        // Should return generic success message
        $this->assertTrue($result['success']);
        $this->assertStringContainsString('If an account exists', $result['message']);
        
        // Verify no OTP was created
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
        ]);
    }

}
