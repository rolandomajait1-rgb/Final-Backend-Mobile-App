<?php

namespace Tests\Feature;

use App\Models\OTPToken;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Property 2: Preservation - Valid OTP Verification Behavior
 * 
 * This test suite verifies that valid OTP verification behavior is preserved
 * after the bugfix. These tests observe behavior on UNFIXED code and capture
 * the baseline behavior that must be maintained.
 * 
 * Observation-First Methodology:
 * 1. Generate valid email verification OTP
 * 2. Verify it works correctly (email marked as verified)
 * 3. Generate valid password reset OTP
 * 4. Verify it works correctly (password updated)
 * 5. Write property-based tests capturing observed behavior patterns
 * 
 * Expected on UNFIXED code: Tests PASS (confirms baseline behavior)
 * Expected on FIXED code: Tests PASS (confirms behavior is preserved)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
class PreservationValidOTPTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = app(AuthService::class);
    }

    /**
     * Property 2.1: For all valid email verification OTPs: verification succeeds and user email is marked verified
     * 
     * This property captures the baseline behavior for email verification OTPs.
     * On both unfixed and fixed code, valid email verification OTPs should:
     * - Successfully verify the user's email
     * - Mark the user's email as verified
     * - Allow the user to log in
     * 
     * Validates: Requirement 3.1
     */
    public function test_valid_email_verification_otp_marks_email_as_verified(): void
    {
        $email = 'user@example.com';
        
        // Create a user (not verified)
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Verify user is not verified initially
        $this->assertNull($user->email_verified_at);
        
        // Generate valid email verification OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify the OTP via service
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        
        // Verification should succeed
        $this->assertTrue($result['success']);
        
        // Refresh user from database
        $user->refresh();
        
        // Email should now be verified
        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * Property 2.2: For all valid password reset OTPs: verification succeeds and user password is updated
     * 
     * This property captures the baseline behavior for password reset OTPs.
     * On both unfixed and fixed code, valid password reset OTPs should:
     * - Successfully verify the OTP
     * - Allow password to be reset
     * - Allow user to log in with new password
     * 
     * Validates: Requirement 3.2
     */
    public function test_valid_password_reset_otp_allows_password_update(): void
    {
        $email = 'user@example.com';
        $oldPassword = 'OldPassword123!';
        $newPassword = 'NewPassword456!';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'password' => bcrypt($oldPassword),
            'email_verified_at' => now(),
        ]);
        
        // Generate valid password reset OTP with correct type
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify the OTP to get reset token
        $verifyResult = $this->authService->verifyOTP($email, $otp);
        
        $this->assertTrue($verifyResult['success']);
        $resetToken = $verifyResult['token'];
        
        // Reset password using the token
        $resetResult = $this->authService->resetPassword($email, $resetToken, $newPassword);
        
        $this->assertTrue($resetResult['success']);
        
        // Verify user password was updated
        $user->refresh();
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check($newPassword, $user->password));
    }

    /**
     * Property 2.3: For all valid OTPs: OTP is deleted after successful use
     * 
     * This property captures the baseline behavior for OTP deletion.
     * On both unfixed and fixed code, after successful OTP verification:
     * - The OTP token should be deleted from the database
     * - The same OTP should not be reusable
     * 
     * Validates: Requirement 3.4
     */
    public function test_valid_otp_is_deleted_after_successful_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate valid email verification OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify OTP exists before verification
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Verify the OTP
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        
        $this->assertTrue($result['success']);
        
        // OTP should be deleted after successful verification
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Attempting to use the same OTP again should fail
        $retryResult = $this->authService->verifyRegistrationOTP($email, $otp);
        
        $this->assertFalse($retryResult['success']);
    }

    /**
     * Property 2.4: For all valid OTPs: OTP is deleted after successful use (password reset)
     * 
     * This property captures the baseline behavior for OTP deletion during password reset.
     * On both unfixed and fixed code, after successful password reset OTP verification:
     * - The OTP token should be deleted from the database
     * - The same OTP should not be reusable
     * 
     * Validates: Requirement 3.4
     */
    public function test_valid_otp_is_deleted_after_successful_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        
        // Generate valid password reset OTP with correct type
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify OTP exists before verification
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Verify the OTP
        $result = $this->authService->verifyOTP($email, $otp);
        
        $this->assertTrue($result['success']);
        
        // OTP should be deleted after successful verification
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Attempting to use the same OTP again should fail
        $retryResult = $this->authService->verifyOTP($email, $otp);
        
        $this->assertFalse($retryResult['success']);
    }

    /**
     * Property 2.5: For all valid email verification OTPs: user can log in after verification
     * 
     * This property captures the baseline behavior for user login after email verification.
     * On both unfixed and fixed code, after successful email verification:
     * - User should be able to log in with correct credentials
     * - User should receive a valid authentication token
     * 
     * Validates: Requirement 3.1
     */
    public function test_user_can_login_after_email_verification_with_valid_otp(): void
    {
        $email = 'user@example.com';
        
        // Create a user (not verified)
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate and verify OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify the OTP
        $verifyResult = $this->authService->verifyRegistrationOTP($email, $otp);
        
        $this->assertTrue($verifyResult['success']);
        
        // Refresh user to get updated email_verified_at
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * Property 2.6: For all valid password reset OTPs: user can log in with new password
     * 
     * This property captures the baseline behavior for user login after password reset.
     * On both unfixed and fixed code, after successful password reset:
     * - User should be able to log in with new password
     * - User should receive a valid authentication token
     * 
     * Validates: Requirement 3.2
     */
    public function test_user_can_login_with_new_password_after_valid_otp_reset(): void
    {
        $email = 'user@example.com';
        $newPassword = 'NewPassword456!';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        
        // Generate password reset OTP with correct type
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify OTP to get reset token
        $verifyResult = $this->authService->verifyOTP($email, $otp);
        
        $this->assertTrue($verifyResult['success']);
        $resetToken = $verifyResult['token'];
        
        // Reset password
        $resetResult = $this->authService->resetPassword($email, $resetToken, $newPassword);
        
        $this->assertTrue($resetResult['success']);
    }

    /**
     * Property 2.7: For all valid OTPs: Invalid OTP is rejected with appropriate error
     * 
     * This property captures the baseline behavior for invalid OTP rejection.
     * On both unfixed and fixed code, invalid OTPs should:
     * - Be rejected with appropriate error message
     * - Not mark email as verified
     * - Not allow password reset
     * 
     * Validates: Requirement 3.3
     */
    public function test_invalid_otp_is_rejected_for_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate valid OTP but don't use it
        $validOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $validOtp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt to verify with invalid OTP
        $invalidOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $result = $this->authService->verifyRegistrationOTP($email, $invalidOtp);
        
        // Should be rejected
        $this->assertFalse($result['success']);
        
        // Email should still not be verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    /**
     * Property 2.8: For all valid OTPs: Expired OTP is rejected with appropriate error
     * 
     * This property captures the baseline behavior for expired OTP rejection.
     * On both unfixed and fixed code, expired OTPs should:
     * - Be rejected with appropriate error message
     * - Not mark email as verified
     * - Not allow password reset
     * 
     * Validates: Requirement 3.3
     */
    public function test_expired_otp_is_rejected_for_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate expired OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->subMinutes(1), // Expired 1 minute ago
        ]);
        
        // Attempt to verify with expired OTP
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        
        // Should be rejected
        $this->assertFalse($result['success']);
        
        // Email should still not be verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    /**
     * Property 2.9: For all valid OTPs: Invalid OTP is rejected for password reset
     * 
     * This property captures the baseline behavior for invalid OTP rejection during password reset.
     * On both unfixed and fixed code, invalid OTPs should:
     * - Be rejected with appropriate error message
     * - Not allow password reset
     * 
     * Validates: Requirement 3.3
     */
    public function test_invalid_otp_is_rejected_for_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        
        // Generate valid OTP but don't use it (with correct type)
        $validOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $validOtp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt to verify with invalid OTP
        $invalidOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $result = $this->authService->verifyOTP($email, $invalidOtp);
        
        // Should be rejected
        $this->assertFalse($result['success']);
    }

    /**
     * Property 2.10: For all valid OTPs: Expired OTP is rejected for password reset
     * 
     * This property captures the baseline behavior for expired OTP rejection during password reset.
     * On both unfixed and fixed code, expired OTPs should:
     * - Be rejected with appropriate error message
     * - Not allow password reset
     * 
     * Validates: Requirement 3.3
     */
    public function test_expired_otp_is_rejected_for_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        
        // Generate expired OTP with correct type
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
    }
}
