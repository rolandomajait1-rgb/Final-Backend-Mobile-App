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
 * Integration Tests for Complete Registration Flow with Email Verification
 * 
 * This test suite verifies the complete registration flow with OTP-based email verification.
 * It tests the entire user journey from registration through email verification to login.
 * 
 * Test Scenarios:
 * 1. User submits registration form with email
 * 2. System generates email verification OTP
 * 3. Email is queued for async delivery
 * 4. User receives OTP in email
 * 5. User submits OTP for verification
 * 6. User email is marked as verified
 * 7. User can log in with credentials
 * 
 * Validates: Requirements 3.1, 3.3, 3.4
 */
class RegistrationWithOTPTest extends TestCase
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
     * Test: Complete registration flow with email verification
     * 
     * Scenario:
     * 1. User submits registration form with email
     * 2. System generates email verification OTP
     * 3. Email is queued for async delivery
     * 4. User receives OTP in email
     * 5. User submits OTP for verification
     * 6. User email is marked as verified
     * 7. User can log in with credentials
     * 
     * Validates: Requirements 3.1, 3.3, 3.4
     */
    public function test_complete_registration_flow_with_email_verification(): void
    {
        $email = 'newuser@example.com';
        $password = 'SecurePassword123!';
        $name = 'Test User';
        
        // Step 1: User submits registration form with email
        $user = $this->authService->createUserWithVerification([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);
        
        // Verify user was created
        $this->assertNotNull($user->id);
        $this->assertEquals($email, $user->email);
        $this->assertEquals($name, $user->name);
        
        // Step 2: System generates email verification OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $this->assertNotNull($otpRecord);
        $otp = $otpRecord->otp;
        
        // Verify OTP is 6 digits
        $this->assertMatchesRegularExpression('/^\d{6}$/', $otp);
        
        // Verify OTP has not expired
        $this->assertTrue($otpRecord->expires_at->isFuture());
        
        // Step 3: Email is queued for async delivery
        // (Queue is faked, so we verify the job was dispatched)
        Queue::assertPushed(\App\Jobs\SendOTPEmailJob::class);
        
        // Step 4: User receives OTP in email (simulated by retrieving from DB)
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
        
        // Step 5: User submits OTP for verification
        $verifyResult = $this->authService->verifyRegistrationOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        
        // Step 6: User email is marked as verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        
        // Step 7: User can log in with credentials
        // Verify password is correct
        $this->assertTrue(Hash::check($password, $user->password));
        
        // Verify user exists in database with verified email
        $foundUser = User::where('email', $email)->first();
        $this->assertNotNull($foundUser);
        $this->assertNotNull($foundUser->email_verified_at);
    }

    /**
     * Test: OTP type is "email_verification" in database
     * 
     * Validates: Requirement 2.1
     */
    public function test_otp_type_is_email_verification_in_database(): void
    {
        $email = 'user@example.com';
        
        // Register user
        $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        // Verify OTP type is "email_verification"
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'type' => OTPToken::TYPE_EMAIL_VERIFICATION,
        ]);
    }

    /**
     * Test: OTP cannot be used for password reset
     * 
     * Validates: Requirement 2.5
     */
    public function test_email_verification_otp_cannot_be_used_for_password_reset(): void
    {
        $email = 'user@example.com';
        
        // Register user
        $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        // Get the email verification OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Attempt to use email verification OTP for password reset
        $result = $this->authService->verifyOTP($email, $otp);
        
        // Should fail because OTP type is "email_verification", not "password_reset"
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
     * Validates: Requirement 2.3
     */
    public function test_email_is_sent_asynchronously_response_is_fast(): void
    {
        $email = 'user@example.com';
        
        // Measure registration time
        $startTime = microtime(true);
        
        $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        // Response should be fast (< 500ms)
        // This verifies that email sending is asynchronous and doesn't block
        $this->assertLessThan(500, $executionTime, 'Registration took too long, email might be sent synchronously');
        
        // Verify email job was queued
        Queue::assertPushed(\App\Jobs\SendOTPEmailJob::class);
    }

    /**
     * Test: User can verify email and then log in
     * 
     * Validates: Requirements 3.1, 3.3, 3.4
     */
    public function test_user_can_verify_email_and_then_login(): void
    {
        $email = 'user@example.com';
        $password = 'SecurePassword123!';
        
        // Register user
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => $password,
        ]);
        
        // Verify user is not verified initially
        $this->assertNull($user->email_verified_at);
        
        // Get OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Verify email with OTP
        $verifyResult = $this->authService->verifyRegistrationOTP($email, $otp);
        $this->assertTrue($verifyResult['success']);
        
        // Verify user email is now marked as verified
        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        
        // Verify user can log in with correct credentials
        $this->assertTrue(Hash::check($password, $user->password));
        
        // Verify OTP was deleted after use
        $this->assertDatabaseMissing('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Test: Multiple users can register and verify independently
     * 
     * Validates: Requirements 3.1, 3.3, 3.4
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
     * Test: User cannot verify with wrong OTP
     * 
     * Validates: Requirement 3.3
     */
    public function test_user_cannot_verify_with_wrong_otp(): void
    {
        $email = 'user@example.com';
        
        // Register user
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
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
    }

    /**
     * Test: User cannot reuse same OTP twice
     * 
     * Validates: Requirement 3.4
     */
    public function test_user_cannot_reuse_same_otp_twice(): void
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

    /**
     * Test: Expired OTP is rejected
     * 
     * Validates: Requirement 3.3
     */
    public function test_expired_otp_is_rejected(): void
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
            'type' => OTPToken::TYPE_EMAIL_VERIFICATION,
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

}
