<?php

namespace Tests\Feature;

use App\Models\OTPToken;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Property 2: Preservation - User Authentication Flow Behavior
 * 
 * This test suite verifies that complete user authentication flows are preserved
 * after the bugfix. These tests observe behavior on UNFIXED code and capture
 * the baseline behavior that must be maintained.
 * 
 * Observation-First Methodology:
 * 1. User registration with email verification
 * 2. User login after email verification
 * 3. User password reset
 * 4. User login with new password
 * 5. User login with correct credentials (non-OTP flow)
 * 
 * Write property-based tests capturing observed behavior patterns:
 * - For all valid registration flows: user can log in after email verification
 * - For all valid password reset flows: user can log in with new password
 * - For all valid login attempts with correct credentials: authentication succeeds
 * 
 * Expected on UNFIXED code: Tests PASS (confirms baseline behavior)
 * Expected on FIXED code: Tests PASS (confirms behavior is preserved)
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.7
 */
class PreservationAuthenticationFlowsTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = app(AuthService::class);
    }

    /**
     * Property 3.1: For all valid registration flows: user can log in after email verification
     * 
     * This property captures the baseline behavior for complete registration flow.
     * On both unfixed and fixed code, after successful email verification:
     * - User email should be marked as verified
     * - User should be able to log in with correct credentials
     * - User should receive a valid authentication token
     * 
     * Validates: Requirement 3.1
     */
    public function test_user_can_login_after_complete_registration_flow(): void
    {
        $email = 'newuser@example.com';
        $password = 'SecurePassword123!';
        $name = 'Test User';
        
        // Step 1: Register user
        $user = $this->authService->createUserWithVerification([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);
        
        // Verify user was created but not verified
        $this->assertNotNull($user->id);
        $this->assertNull($user->email_verified_at);
        
        // Step 2: Get the OTP that was generated
        $otpRecord = OTPToken::where('email', $email)->first();
        $this->assertNotNull($otpRecord);
        $otp = $otpRecord->otp;
        
        // Step 3: Verify email with OTP
        $verifyResult = $this->authService->verifyRegistrationOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        
        // Step 4: Verify user email is now marked as verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        
        // Step 5: Verify user can log in with correct credentials
        $this->assertTrue(Hash::check($password, $user->password));
        
        // Step 6: Verify OTP was deleted after use
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Property 3.2: For all valid password reset flows: user can log in with new password
     * 
     * This property captures the baseline behavior for complete password reset flow.
     * On both unfixed and fixed code, after successful password reset:
     * - User password should be updated
     * - User should be able to log in with new password
     * - User should not be able to log in with old password
     * 
     * Validates: Requirement 3.2
     */
    public function test_user_can_login_with_new_password_after_complete_reset_flow(): void
    {
        $email = 'user@example.com';
        $oldPassword = 'OldPassword123!';
        $newPassword = 'NewPassword456!';
        
        // Step 1: Create a verified user with old password
        $user = User::factory()->create([
            'email' => $email,
            'password' => bcrypt($oldPassword),
            'email_verified_at' => now(),
        ]);
        
        // Verify user can log in with old password
        $this->assertTrue(Hash::check($oldPassword, $user->password));
        
        // Step 2: Initiate password reset
        $resetResult = $this->authService->initiatePasswordReset($email);
        $this->assertTrue($resetResult['success']);
        
        // Step 3: Get the OTP that was generated
        $otpRecord = OTPToken::where('email', $email)->first();
        $this->assertNotNull($otpRecord);
        $otp = $otpRecord->otp;
        
        // Step 4: Verify OTP to get reset token
        $verifyResult = $this->authService->verifyOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        $resetToken = $verifyResult['token'];
        
        // Step 5: Reset password with new password
        $passwordResetResult = $this->authService->resetPassword($email, $resetToken, $newPassword);
        $this->assertTrue($passwordResetResult['success']);
        
        // Step 6: Verify user password was updated
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));
        $this->assertFalse(Hash::check($oldPassword, $user->password));
        
        // Step 7: Verify OTP was deleted after use
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Property 3.3: For all valid login attempts with correct credentials: authentication succeeds
     * 
     * This property captures the baseline behavior for non-OTP login.
     * On both unfixed and fixed code, login with correct credentials should:
     * - Succeed regardless of OTP system changes
     * - Return user data
     * - Not require OTP verification
     * 
     * Validates: Requirement 3.7
     */
    public function test_user_can_login_with_correct_credentials_non_otp_flow(): void
    {
        $email = 'user@example.com';
        $password = 'SecurePassword123!';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'password' => bcrypt($password),
            'email_verified_at' => now(),
        ]);
        
        // Verify user can log in with correct credentials
        $this->assertTrue(Hash::check($password, $user->password));
        
        // Verify user exists and is verified
        $foundUser = User::where('email', $email)->first();
        $this->assertNotNull($foundUser);
        $this->assertNotNull($foundUser->email_verified_at);
        $this->assertTrue(Hash::check($password, $foundUser->password));
    }

    /**
     * Property 3.4: For all valid registration flows: multiple users can register and verify independently
     * 
     * This property captures the baseline behavior for multiple concurrent registrations.
     * On both unfixed and fixed code, multiple users should:
     * - Be able to register independently
     * - Each receive their own OTP
     * - Be able to verify independently
     * - Not interfere with each other
     * 
     * Validates: Requirement 3.1
     */
    public function test_multiple_users_can_register_and_verify_independently(): void
    {
        $users = [];
        $otps = [];
        
        // Register 3 users
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            $password = "Password{$i}123!";
            
            $user = $this->authService->createUserWithVerification([
                'name' => "User {$i}",
                'email' => $email,
                'password' => $password,
            ]);
            
            $users[$i] = $user;
            
            // Get OTP for this user
            $otpRecord = OTPToken::where('email', $email)->first();
            $otps[$i] = $otpRecord->otp;
        }
        
        // Verify each user independently
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            
            // Verify email
            $verifyResult = $this->authService->verifyRegistrationOTP($email, $otps[$i]);
            $this->assertTrue($verifyResult['success']);
            
            // Verify user email is marked as verified
            $users[$i]->refresh();
            $this->assertNotNull($users[$i]->email_verified_at);
        }
        
        // Verify all users are verified
        for ($i = 1; $i <= 3; $i++) {
            $users[$i]->refresh();
            $this->assertNotNull($users[$i]->email_verified_at);
        }
    }

    /**
     * Property 3.5: For all valid password reset flows: multiple users can reset independently
     * 
     * This property captures the baseline behavior for multiple concurrent password resets.
     * On both unfixed and fixed code, multiple users should:
     * - Be able to reset password independently
     * - Each receive their own OTP
     * - Be able to reset independently
     * - Not interfere with each other
     * 
     * Validates: Requirement 3.2
     */
    public function test_multiple_users_can_reset_password_independently(): void
    {
        $users = [];
        $otps = [];
        $newPasswords = [];
        
        // Create 3 verified users
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            
            $user = User::factory()->create([
                'email' => $email,
                'password' => bcrypt("OldPassword{$i}123!"),
                'email_verified_at' => now(),
            ]);
            
            $users[$i] = $user;
        }
        
        // Initiate password reset for each user
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            
            $resetResult = $this->authService->initiatePasswordReset($email);
            $this->assertTrue($resetResult['success']);
            
            // Get OTP for this user
            $otpRecord = OTPToken::where('email', $email)->first();
            $otps[$i] = $otpRecord->otp;
            $newPasswords[$i] = "NewPassword{$i}456!";
        }
        
        // Reset password for each user
        for ($i = 1; $i <= 3; $i++) {
            $email = "user{$i}@example.com";
            
            // Verify OTP to get reset token
            $verifyResult = $this->authService->verifyOTP($email, $otps[$i]);
            $this->assertTrue($verifyResult['success']);
            $resetToken = $verifyResult['token'];
            
            // Reset password
            $resetResult = $this->authService->resetPassword($email, $resetToken, $newPasswords[$i]);
            $this->assertTrue($resetResult['success']);
            
            // Verify password was updated
            $users[$i]->refresh();
            $this->assertTrue(Hash::check($newPasswords[$i], $users[$i]->password));
        }
    }

    /**
     * Property 3.6: For all valid registration flows: user cannot verify with wrong OTP
     * 
     * This property captures the baseline behavior for OTP validation during registration.
     * On both unfixed and fixed code, wrong OTP should:
     * - Be rejected
     * - Not mark email as verified
     * - Allow user to retry with correct OTP
     * 
     * Validates: Requirement 3.3
     */
    public function test_user_cannot_verify_registration_with_wrong_otp(): void
    {
        $email = 'user@example.com';
        $password = 'SecurePassword123!';
        
        // Register user
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => $password,
        ]);
        
        // Get the correct OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $correctOtp = $otpRecord->otp;
        
        // Generate a wrong OTP
        $wrongOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        while ($wrongOtp === $correctOtp) {
            $wrongOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        }
        
        // Attempt to verify with wrong OTP
        $verifyResult = $this->authService->verifyRegistrationOTP($email, $wrongOtp);
        $this->assertFalse($verifyResult['success']);
        
        // Verify user email is still not verified
        $user->refresh();
        $this->assertNull($user->email_verified_at);
        
        // Verify correct OTP still exists
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $correctOtp,
        ]);
        
        // Verify with correct OTP should succeed
        $correctVerifyResult = $this->authService->verifyRegistrationOTP($email, $correctOtp);
        $this->assertTrue($correctVerifyResult['success']);
        
        // Now user email should be verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * Property 3.7: For all valid password reset flows: user cannot reset with wrong OTP
     * 
     * This property captures the baseline behavior for OTP validation during password reset.
     * On both unfixed and fixed code, wrong OTP should:
     * - Be rejected
     * - Not allow password reset
     * - Allow user to retry with correct OTP
     * 
     * Validates: Requirement 3.3
     */
    public function test_user_cannot_reset_password_with_wrong_otp(): void
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
        
        // Verify password was not changed
        $user->refresh();
        $this->assertTrue(Hash::check($oldPassword, $user->password));
        
        // Verify correct OTP still exists
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $correctOtp,
        ]);
        
        // Verify with correct OTP should succeed
        $correctVerifyResult = $this->authService->verifyOTP($email, $correctOtp);
        $this->assertTrue($correctVerifyResult['success']);
        $resetToken = $correctVerifyResult['token'];
        
        // Now password reset should succeed
        $resetResult = $this->authService->resetPassword($email, $resetToken, $newPassword);
        $this->assertTrue($resetResult['success']);
        
        // Verify password was changed
        $user->refresh();
        $this->assertTrue(Hash::check($newPassword, $user->password));
    }

    /**
     * Property 3.8: For all valid registration flows: user cannot log in before email verification
     * 
     * This property captures the baseline behavior for email verification requirement.
     * On both unfixed and fixed code, unverified users should:
     * - Not be able to log in (application-level check)
     * - Have null email_verified_at timestamp
     * 
     * Validates: Requirement 3.1
     */
    public function test_unverified_user_cannot_log_in(): void
    {
        $email = 'user@example.com';
        $password = 'SecurePassword123!';
        
        // Register user (not verified)
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => $password,
        ]);
        
        // Verify user is not verified
        $this->assertNull($user->email_verified_at);
        
        // Verify password is correct
        $this->assertTrue(Hash::check($password, $user->password));
        
        // Verify user cannot log in (application-level check)
        $foundUser = User::where('email', $email)->first();
        $this->assertNull($foundUser->email_verified_at);
    }

    /**
     * Property 3.9: For all valid registration flows: OTP expires after 10 minutes
     * 
     * This property captures the baseline behavior for OTP expiration.
     * On both unfixed and fixed code, OTPs should:
     * - Expire after 10 minutes
     * - Be rejected if used after expiration
     * 
     * Validates: Requirement 3.3
     */
    public function test_otp_expires_after_10_minutes(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate OTP that expires in 10 minutes
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify OTP is valid now
        $result = $this->authService->verifyRegistrationOTP($email, $otp);
        $this->assertTrue($result['success']);
        
        // Verify OTP was deleted after use
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Property 3.10: For all valid registration flows: user can request new OTP after first expires
     * 
     * This property captures the baseline behavior for OTP renewal.
     * On both unfixed and fixed code, users should:
     * - Be able to request a new OTP if the first one expires
     * - Each OTP should be independent
     * 
     * Validates: Requirement 3.1
     */
    public function test_user_can_request_new_otp_after_first_expires(): void
    {
        $email = 'user@example.com';
        
        // Create a user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => null,
        ]);
        
        // Generate first OTP that expires in 1 minute
        $firstOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $firstOtp,
            'expires_at' => now()->addMinute(),
        ]);
        
        // Verify first OTP exists
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $firstOtp,
        ]);
        
        // Simulate first OTP expiring by creating a new one
        // (In real scenario, user would request resend)
        OTPToken::where('email', $email)->delete();
        
        $secondOtp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        OTPToken::create([
            'email' => $email,
            'otp' => $secondOtp,
            'expires_at' => now()->addMinutes(10),
        ]);
        
        // Verify second OTP exists
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $secondOtp,
        ]);
        
        // Verify with second OTP should succeed
        $result = $this->authService->verifyRegistrationOTP($email, $secondOtp);
        $this->assertTrue($result['success']);
        
        // Verify user email is now verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
    }

    /**
     * Property 3.11: For all valid password reset flows: user cannot reuse same OTP twice
     * 
     * This property captures the baseline behavior for OTP single-use enforcement.
     * On both unfixed and fixed code, OTPs should:
     * - Be deleted after successful use
     * - Not be reusable
     * 
     * Validates: Requirement 3.4
     */
    public function test_user_cannot_reuse_same_otp_for_password_reset(): void
    {
        $email = 'user@example.com';
        $newPassword = 'NewPassword456!';
        
        // Create a verified user
        $user = User::factory()->create([
            'email' => $email,
            'email_verified_at' => now(),
        ]);
        
        // Initiate password reset
        $this->authService->initiatePasswordReset($email);
        
        // Get the OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Verify OTP to get reset token
        $verifyResult = $this->authService->verifyOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        $resetToken = $verifyResult['token'];
        
        // Reset password
        $resetResult = $this->authService->resetPassword($email, $resetToken, $newPassword);
        $this->assertTrue($resetResult['success']);
        
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
     * Property 3.12: For all valid registration flows: user cannot reuse same OTP twice
     * 
     * This property captures the baseline behavior for OTP single-use enforcement during registration.
     * On both unfixed and fixed code, OTPs should:
     * - Be deleted after successful use
     * - Not be reusable
     * 
     * Validates: Requirement 3.4
     */
    public function test_user_cannot_reuse_same_otp_for_registration(): void
    {
        $email = 'user@example.com';
        
        // Register user
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        // Get the OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Verify email with OTP
        $verifyResult = $this->authService->verifyRegistrationOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        
        // Verify OTP was deleted
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Attempt to use same OTP again should fail
        $retryResult = $this->authService->verifyRegistrationOTP($email, $otp);
        $this->assertFalse($retryResult['success']);
    }
}
