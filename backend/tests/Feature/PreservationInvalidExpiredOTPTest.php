<?php

namespace Tests\Feature;

use App\Models\OTPToken;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Property 2: Preservation - Invalid/Expired OTP Rejection Behavior
 * 
 * This test suite verifies that invalid/expired OTP rejection behavior is preserved
 * after the bugfix. These tests observe behavior on UNFIXED code and capture
 * the baseline behavior that must be maintained.
 * 
 * Observation-First Methodology:
 * 1. Attempt to verify with invalid OTP code
 * 2. Attempt to verify with expired OTP
 * 3. Attempt to verify with non-existent email
 * 4. Write property-based tests capturing observed behavior patterns
 * 
 * Expected on UNFIXED code: Tests PASS (confirms baseline behavior)
 * Expected on FIXED code: Tests PASS (confirms behavior is preserved)
 * 
 * Validates: Requirements 3.5, 3.6, 3.7
 */
class PreservationInvalidExpiredOTPTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = app(AuthService::class);
    }

    /**
     * Property 2.1: For all invalid OTPs: verification fails with appropriate error
     * 
     * This property captures the baseline behavior for invalid OTP rejection.
     * On both unfixed and fixed code, invalid OTPs should:
     * - Be rejected with appropriate error message
     * - Not mark email as verified
     * - Not allow password reset
     * 
     * Validates: Requirement 3.3
     */
    public function test_invalid_otp_code_is_rejected_for_email_verification(): void
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
        $this->assertIsString($result['message']);
        
        // Email should still not be verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    /**
     * Property 2.2: For all invalid OTPs: verification fails for password reset
     * 
     * This property captures the baseline behavior for invalid OTP rejection during password reset.
     * On both unfixed and fixed code, invalid OTPs should:
     * - Be rejected with appropriate error message
     * - Not allow password reset
     * 
     * Validates: Requirement 3.3
     */
    public function test_invalid_otp_code_is_rejected_for_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
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
        $result = $this->authService->verifyOTP($email, $invalidOtp);
        
        // Should be rejected
        $this->assertFalse($result['success']);
        $this->assertIsString($result['message']);
        $this->assertNull($result['token']);
    }

    /**
     * Property 2.3: For all expired OTPs: verification fails with expiration error
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
        $this->assertIsString($result['message']);
        
        // Email should still not be verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    /**
     * Property 2.4: For all expired OTPs: verification fails for password reset
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
        
        // Generate expired OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->subMinutes(1), // Expired 1 minute ago
        ]);
        
        // Attempt to verify with expired OTP
        $result = $this->authService->verifyOTP($email, $otp);
        
        // Should be rejected
        $this->assertFalse($result['success']);
        $this->assertIsString($result['message']);
        $this->assertNull($result['token']);
    }

    /**
     * Property 2.5: For all non-existent emails: generic success message returned (prevent enumeration)
     * 
     * This property captures the baseline behavior for non-existent email handling.
     * On both unfixed and fixed code, requests for non-existent emails should:
     * - Return a generic success message
     * - Not reveal whether the email exists
     * - Prevent user enumeration attacks
     * 
     * Validates: Requirement 3.5, 3.6
     */
    public function test_non_existent_email_returns_generic_success_for_password_reset(): void
    {
        $nonExistentEmail = 'nonexistent@example.com';
        
        // Attempt password reset for non-existent email
        $result = $this->authService->initiatePasswordReset($nonExistentEmail);
        
        // Should return success (generic message to prevent enumeration)
        $this->assertTrue($result['success']);
        $this->assertIsString($result['message']);
        
        // Verify no OTP was created for non-existent email
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $nonExistentEmail,
        ]);
    }

    /**
     * Property 2.6: For all non-existent emails: generic success message returned for verification resend
     * 
     * This property captures the baseline behavior for non-existent email handling during verification resend.
     * On both unfixed and fixed code, resend verification for non-existent emails should:
     * - Return a generic success message
     * - Not reveal whether the email exists
     * - Prevent user enumeration attacks
     * 
     * Validates: Requirement 3.5, 3.6
     */
    public function test_non_existent_email_returns_generic_success_for_verification_resend(): void
    {
        $nonExistentEmail = 'nonexistent@example.com';
        
        // Attempt to resend verification for non-existent email
        $result = $this->authService->resendVerification($nonExistentEmail);
        
        // Should return success (generic message to prevent enumeration)
        $this->assertTrue($result['success']);
        $this->assertIsString($result['message']);
    }

    /**
     * Property 2.7: For all invalid OTPs: OTP is not deleted (remains for retry)
     * 
     * This property captures the baseline behavior for OTP persistence on invalid attempts.
     * On both unfixed and fixed code, invalid OTP attempts should:
     * - Not delete the valid OTP
     * - Allow the user to retry with the correct OTP
     * 
     * Validates: Requirement 3.3
     */
    public function test_invalid_otp_attempt_does_not_delete_valid_otp(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate valid OTP
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
        
        // Valid OTP should still exist in database
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $validOtp,
        ]);
        
        // User should be able to retry with correct OTP
        $retryResult = $this->authService->verifyRegistrationOTP($email, $validOtp);
        
        $this->assertTrue($retryResult['success']);
    }

    /**
     * Property 2.8: For all expired OTPs: OTP is not deleted (remains in database)
     * 
     * This property captures the baseline behavior for expired OTP persistence.
     * On both unfixed and fixed code, expired OTP attempts should:
     * - Not delete the expired OTP
     * - Keep the OTP in database for audit/logging purposes
     * 
     * Validates: Requirement 3.3
     */
    public function test_expired_otp_attempt_does_not_delete_otp(): void
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
        
        // Expired OTP should still exist in database
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Property 2.9: For all invalid OTPs: multiple invalid attempts are rejected
     * 
     * This property captures the baseline behavior for multiple invalid OTP attempts.
     * On both unfixed and fixed code, multiple invalid attempts should:
     * - All be rejected
     * - Not mark email as verified
     * - Not allow password reset
     * 
     * Validates: Requirement 3.3
     */
    public function test_multiple_invalid_otp_attempts_are_all_rejected(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate valid OTP
        $validOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $validOtp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt multiple invalid OTPs
        for ($i = 0; $i < 3; $i++) {
            $invalidOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $result = $this->authService->verifyRegistrationOTP($email, $invalidOtp);
            
            // All should be rejected
            $this->assertFalse($result['success']);
        }
        
        // Email should still not be verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
        
        // Valid OTP should still exist
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $validOtp,
        ]);
    }

    /**
     * Property 2.10: For all OTPs: verification with empty OTP is rejected
     * 
     * This property captures the baseline behavior for empty OTP handling.
     * On both unfixed and fixed code, empty OTPs should:
     * - Be rejected with appropriate error message
     * - Not mark email as verified
     * 
     * Validates: Requirement 3.3
     */
    public function test_empty_otp_is_rejected_for_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate valid OTP
        $validOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $validOtp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt to verify with empty OTP
        $result = $this->authService->verifyRegistrationOTP($email, '');
        
        // Should be rejected
        $this->assertFalse($result['success']);
        
        // Email should still not be verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    /**
     * Property 2.11: For all OTPs: verification with wrong email is rejected
     * 
     * This property captures the baseline behavior for wrong email handling.
     * On both unfixed and fixed code, OTP verification with wrong email should:
     * - Be rejected with appropriate error message
     * - Not mark email as verified
     * 
     * Validates: Requirement 3.3
     */
    public function test_otp_with_wrong_email_is_rejected(): void
    {
        $email = 'user@example.com';
        $wrongEmail = 'wrong@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate valid OTP for correct email
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt to verify with wrong email
        $result = $this->authService->verifyRegistrationOTP($wrongEmail, $otp);
        
        // Should be rejected
        $this->assertFalse($result['success']);
        
        // Original user email should still not be verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    /**
     * Property 2.12: For all OTPs: verification with non-existent email returns appropriate error
     * 
     * This property captures the baseline behavior for non-existent email during OTP verification.
     * On both unfixed and fixed code, OTP verification for non-existent email should:
     * - Be rejected with appropriate error message
     * 
     * Validates: Requirement 3.3
     */
    public function test_otp_verification_with_non_existent_email_is_rejected(): void
    {
        $nonExistentEmail = 'nonexistent@example.com';
        
        // Generate OTP for non-existent email
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $nonExistentEmail,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Attempt to verify OTP for non-existent email
        $result = $this->authService->verifyRegistrationOTP($nonExistentEmail, $otp);
        
        // Should be rejected (user not found)
        $this->assertFalse($result['success']);
    }

    /**
     * Property 2.13: For all OTPs: OTP with far future expiration is accepted
     * 
     * This property captures the baseline behavior for OTP with far future expiration.
     * On both unfixed and fixed code, OTPs with far future expiration should:
     * - Be accepted and verified successfully
     * - Mark email as verified
     * 
     * Validates: Requirement 3.1
     */
    public function test_otp_with_far_future_expiration_is_accepted(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate OTP with far future expiration
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addDays(30), // Expires in 30 days
        ]);
        
        // Verify the OTP
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        
        // Should succeed
        $this->assertTrue($result['success']);
        
        // Email should be verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * Property 2.14: For all OTPs: OTP at exact expiration boundary is rejected
     * 
     * This property captures the baseline behavior for OTP at exact expiration boundary.
     * On both unfixed and fixed code, OTPs at exact expiration time should:
     * - Be rejected (expires_at > now() check)
     * 
     * Validates: Requirement 3.3
     */
    public function test_otp_at_exact_expiration_boundary_is_rejected(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate OTP that expires exactly now
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now(), // Expires exactly now
        ]);
        
        // Attempt to verify the OTP
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        
        // Should be rejected (expires_at must be > now())
        $this->assertFalse($result['success']);
    }
}
