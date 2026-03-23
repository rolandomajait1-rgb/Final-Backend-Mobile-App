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
 * Integration Tests for OTP Type Validation
 * 
 * This test suite verifies that OTP type validation works correctly and prevents
 * misuse of OTPs across different purposes (email verification vs password reset).
 * 
 * Test Scenarios:
 * 1. Generate email verification OTP, attempt to use for password reset (should fail)
 * 2. Generate password reset OTP, attempt to use for email verification (should fail)
 * 3. Generate multiple OTPs for same email, verify each has correct type
 * 4. Verify error messages are appropriate for type mismatches
 * 
 * Validates: Requirements 2.5, 2.6
 */
class OTPTypeValidationTest extends TestCase
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
     * Test: Email verification OTP cannot be used for password reset
     * 
     * Scenario:
     * 1. User registers and receives email verification OTP
     * 2. Attempt to use that OTP for password reset
     * 3. Request should fail with type mismatch error
     * 
     * Validates: Requirement 2.5
     */
    public function test_email_verification_otp_cannot_be_used_for_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Step 1: Register user (generates email verification OTP)
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        // Step 2: Get the email verification OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $this->assertNotNull($otpRecord);
        $this->assertEquals(OTPToken::TYPE_EMAIL_VERIFICATION, $otpRecord->type);
        $otp = $otpRecord->otp;
        
        // Step 3: Attempt to use email verification OTP for password reset
        $result = $this->authService->verifyOTP($email, $otp);
        
        // Should fail because OTP type is "email_verification", not "password_reset"
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('type', strtolower($result['message'] ?? ''));
        
        // Step 4: Verify OTP still exists (not deleted on failed attempt)
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
            'type' => OTPToken::TYPE_EMAIL_VERIFICATION,
        ]);
    }

    /**
     * Test: Password reset OTP cannot be used for email verification
     * 
     * Scenario:
     * 1. User initiates password reset and receives password reset OTP
     * 2. Attempt to use that OTP for email verification
     * 3. Request should fail with type mismatch error
     * 
     * Validates: Requirement 2.6
     */
    public function test_password_reset_otp_cannot_be_used_for_email_verification(): void
    {
        $email = 'user@example.com';
        
        // Step 1: Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Step 2: Initiate password reset (generates password reset OTP)
        $this->authService->initiatePasswordReset($email);
        
        // Step 3: Get the password reset OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $this->assertNotNull($otpRecord);
        $this->assertEquals(OTPToken::TYPE_PASSWORD_RESET, $otpRecord->type);
        $otp = $otpRecord->otp;
        
        // Step 4: Attempt to use password reset OTP for email verification
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        
        // Should fail because OTP type is "password_reset", not "email_verification"
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('type', strtolower($result['message'] ?? ''));
        
        // Step 5: Verify OTP still exists (not deleted on failed attempt)
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
        ]);
    }

    /**
     * Test: Multiple OTPs for same email have correct types
     * 
     * Scenario:
     * 1. User registers (generates email verification OTP)
     * 2. User initiates password reset (generates password reset OTP)
     * 3. Verify both OTPs exist with correct types
     * 4. Verify each OTP can only be used for its intended purpose
     * 
     * Validates: Requirements 2.5, 2.6
     */
    public function test_multiple_otps_for_same_email_have_correct_types(): void
    {
        $email = 'user@example.com';
        
        // Step 1: Register user (generates email verification OTP)
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        // Step 2: Get the email verification OTP
        $emailVerificationOtpRecord = OTPToken::where('email', $email)
            ->where('type', OTPToken::TYPE_EMAIL_VERIFICATION)
            ->first();
        $this->assertNotNull($emailVerificationOtpRecord);
        $emailVerificationOtp = $emailVerificationOtpRecord->otp;
        
        // Step 3: Verify email first
        $verifyResult = $this->authService->verifyRegistrationOTP($email, $emailVerificationOtp);
        $this->assertTrue($verifyResult['success']);
        
        // Step 4: Initiate password reset (generates password reset OTP)
        $this->authService->initiatePasswordReset($email);
        
        // Step 5: Get the password reset OTP
        $passwordResetOtpRecord = OTPToken::where('email', $email)
            ->where('type', OTPToken::TYPE_PASSWORD_RESET)
            ->first();
        $this->assertNotNull($passwordResetOtpRecord);
        $passwordResetOtp = $passwordResetOtpRecord->otp;
        
        // Step 6: Verify both OTPs have different types
        $this->assertNotEquals($emailVerificationOtp, $passwordResetOtp);
        $this->assertEquals(OTPToken::TYPE_PASSWORD_RESET, $passwordResetOtpRecord->type);
        
        // Step 7: Verify password reset OTP cannot be used for email verification
        $result = $this->authService->verifyRegistrationOTP($email, $passwordResetOtp);
        $this->assertFalse($result['success']);
        
        // Step 8: Verify password reset OTP can be used for password reset
        $verifyPasswordResetResult = $this->authService->verifyOTP($email, $passwordResetOtp);
        $this->assertTrue($verifyPasswordResetResult['success']);
    }

    /**
     * Test: Error messages are appropriate for type mismatches
     * 
     * Scenario:
     * 1. Generate email verification OTP
     * 2. Attempt to use for password reset
     * 3. Verify error message indicates type mismatch
     * 4. Generate password reset OTP
     * 5. Attempt to use for email verification
     * 6. Verify error message indicates type mismatch
     * 
     * Validates: Requirements 2.5, 2.6
     */
    public function test_error_messages_are_appropriate_for_type_mismatches(): void
    {
        $email = 'user@example.com';
        
        // Scenario 1: Email verification OTP used for password reset
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        $emailVerificationOtpRecord = OTPToken::where('email', $email)->first();
        $emailVerificationOtp = $emailVerificationOtpRecord->otp;
        
        $result = $this->authService->verifyOTP($email, $emailVerificationOtp);
        
        // Verify error message is appropriate
        $this->assertFalse($result['success']);
        $this->assertIsString($result['message']);
        $this->assertNotEmpty($result['message']);
        // Error message should indicate type mismatch or invalid OTP
        $this->assertTrue(
            str_contains(strtolower($result['message']), 'type') ||
            str_contains(strtolower($result['message']), 'invalid') ||
            str_contains(strtolower($result['message']), 'mismatch'),
            "Error message should indicate type mismatch: {$result['message']}"
        );
        
        // Scenario 2: Password reset OTP used for email verification
        $user2 = User::factory()->create([
            'email' => 'user2@example.com',
            'email_verified_at' => null,
        ]);
        
        $this->authService->initiatePasswordReset('user2@example.com');
        
        $passwordResetOtpRecord = OTPToken::where('email', 'user2@example.com')->first();
        $passwordResetOtp = $passwordResetOtpRecord->otp;
        
        $result2 = $this->authService->verifyRegistrationOTP('user2@example.com', $passwordResetOtp);
        
        // Verify error message is appropriate
        $this->assertFalse($result2['success']);
        $this->assertIsString($result2['message']);
        $this->assertNotEmpty($result2['message']);
        // Error message should indicate type mismatch or invalid OTP
        $this->assertTrue(
            str_contains(strtolower($result2['message']), 'type') ||
            str_contains(strtolower($result2['message']), 'invalid') ||
            str_contains(strtolower($result2['message']), 'mismatch'),
            "Error message should indicate type mismatch: {$result2['message']}"
        );
    }

    /**
     * Test: Correct OTP type can be used for intended purpose
     * 
     * Scenario:
     * 1. Generate email verification OTP
     * 2. Use it for email verification (should succeed)
     * 3. Generate password reset OTP
     * 4. Use it for password reset (should succeed)
     * 
     * Validates: Requirements 2.1, 2.2
     */
    public function test_correct_otp_type_can_be_used_for_intended_purpose(): void
    {
        $email = 'user@example.com';
        
        // Scenario 1: Email verification OTP used for email verification
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        $emailVerificationOtpRecord = OTPToken::where('email', $email)->first();
        $emailVerificationOtp = $emailVerificationOtpRecord->otp;
        
        $result = $this->authService->verifyRegistrationOTP($email, $emailVerificationOtp);
        
        // Should succeed
        $this->assertTrue($result['success']);
        
        // Verify email is marked as verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        
        // Scenario 2: Password reset OTP used for password reset
        $user2 = User::factory()->create([
            'email' => 'user2@example.com',
            'password' => Hash::make('OldPassword123!'),
            'email_verified_at' => now(),
        ]);
        
        $this->authService->initiatePasswordReset('user2@example.com');
        
        $passwordResetOtpRecord = OTPToken::where('email', 'user2@example.com')->first();
        $passwordResetOtp = $passwordResetOtpRecord->otp;
        
        $result2 = $this->authService->verifyOTP('user2@example.com', $passwordResetOtp);
        
        // Should succeed
        $this->assertTrue($result2['success']);
        $resetToken = $result2['token'];
        
        // Reset password
        $resetResult = $this->authService->resetPassword('user2@example.com', $resetToken, 'NewPassword456!');
        $this->assertTrue($resetResult['success']);
        
        // Verify password is updated
        $user2->refresh();
        $this->assertTrue(Hash::check('NewPassword456!', $user2->password));
    }

    /**
     * Test: OTP type is enforced at database level
     * 
     * Scenario:
     * 1. Create email verification OTP
     * 2. Verify type is stored correctly in database
     * 3. Create password reset OTP
     * 4. Verify type is stored correctly in database
     * 
     * Validates: Requirements 2.1, 2.2
     */
    public function test_otp_type_is_enforced_at_database_level(): void
    {
        $email1 = 'user1@example.com';
        $email2 = 'user2@example.com';
        
        // Create email verification OTP
        $this->authService->createUserWithVerification([
            'name' => 'User 1',
            'email' => $email1,
            'password' => 'SecurePassword123!',
        ]);
        
        // Verify type in database
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email1,
            'type' => OTPToken::TYPE_EMAIL_VERIFICATION,
        ]);
        
        // Create password reset OTP
        User::factory()->create([
            'email' => $email2,
            'email_verified_at' => now(),
        ]);
        
        $this->authService->initiatePasswordReset($email2);
        
        // Verify type in database
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email2,
            'type' => OTPToken::TYPE_PASSWORD_RESET,
        ]);
    }

}
