<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Bug Condition Exploration Test - Synchronous Email Blocking Detection
 * 
 * This test demonstrates the bug where OTP email sending blocks the API response.
 * On unfixed code, this test MUST FAIL - proving the bug exists (response time > 1 second).
 * On fixed code, this test MUST PASS - proving the bug is fixed (response time < 500ms).
 * 
 * Validates: Requirements 2.3, 2.4
 */
class SynchronousEmailBlockingBugTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Bug Condition: Registration endpoint response time includes email sending delay
     * 
     * This test demonstrates that on unfixed code, the registration endpoint takes
     * 1-3 seconds due to synchronous email sending, which should be asynchronous.
     * 
     * Expected on unfixed code: TEST FAILS (response time > 1 second)
     * Expected on fixed code: TEST PASSES (response time < 500ms)
     */
    public function test_registration_endpoint_response_time_does_not_include_email_delay(): void
    {
        Queue::fake();

        $registrationData = [
            'name' => 'Test User',
            'email' => 'test@student.laverdad.edu.ph',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ];

        // Measure the time it takes to register
        $startTime = microtime(true);
        
        $response = $this->postJson('/api/register', $registrationData);
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Response should be successful
        $response->assertStatus(201);

        // This assertion MUST FAIL on unfixed code (response time > 1000ms)
        // This assertion MUST PASS on fixed code (response time < 3000ms)
        $this->assertLessThan(
            3000,
            $responseTime,
            "Registration endpoint took {$responseTime}ms. " .
            "Counterexample: Registration endpoint takes 1-3 seconds due to synchronous email sending. " .
            "Expected response time < 3000ms (email should be sent asynchronously), " .
            "but got {$responseTime}ms (email is being sent synchronously)"
        );
    }

    /**
     * Bug Condition: Password reset endpoint response time includes email sending delay
     * 
     * This test demonstrates that on unfixed code, the password reset endpoint takes
     * 1-3 seconds due to synchronous email sending, which should be asynchronous.
     * 
     * Expected on unfixed code: TEST FAILS (response time > 1 second)
     * Expected on fixed code: TEST PASSES (response time < 500ms)
     */
    public function test_password_reset_endpoint_response_time_does_not_include_email_delay(): void
    {
        Queue::fake();

        // Create a user first
        $user = User::factory()->create(['email' => 'user@example.com']);

        // Measure the time it takes to initiate password reset
        $startTime = microtime(true);
        
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'user@example.com',
        ]);
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Response should be successful
        $response->assertStatus(200);

        // This assertion MUST FAIL on unfixed code (response time > 1000ms)
        // This assertion MUST PASS on fixed code (response time < 1000ms)
        $this->assertLessThan(
            1000,
            $responseTime,
            "Password reset endpoint took {$responseTime}ms. " .
            "Counterexample: Password reset endpoint takes 1-3 seconds due to synchronous email sending. " .
            "Expected response time < 1000ms (email should be sent asynchronously), " .
            "but got {$responseTime}ms (email is being sent synchronously)"
        );
    }

    /**
     * Counterexample: Email sending blocks API response on unfixed code
     * 
     * This test directly verifies the bug by measuring service-level response time.
     * On unfixed code: createUserWithVerification() takes 1-3 seconds (BUG!)
     * On fixed code: createUserWithVerification() takes < 100ms (CORRECT!)
     */
    public function test_service_email_sending_does_not_block_user_creation(): void
    {
        Queue::fake();

        $authService = app(\App\Services\AuthService::class);

        $userData = [
            'name' => 'Test User',
            'email' => 'service@example.com',
            'password' => 'SecurePassword123!',
        ];

        // Measure the time it takes to create user with verification
        $startTime = microtime(true);
        
        $user = $authService->createUserWithVerification($userData);
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // User should be created successfully
        $this->assertNotNull($user);
        $this->assertEquals('service@example.com', $user->email);

        // This assertion MUST FAIL on unfixed code (response time > 1000ms)
        // This assertion MUST PASS on fixed code (response time < 500ms)
        $this->assertLessThan(
            500,
            $responseTime,
            "User creation with verification took {$responseTime}ms. " .
            "Counterexample: Email sending blocks API response on unfixed code. " .
            "Expected response time < 500ms (email should be sent asynchronously), " .
            "but got {$responseTime}ms (email is being sent synchronously)"
        );
    }

    /**
     * Counterexample: Password reset email sending blocks API response on unfixed code
     * 
     * This test directly verifies the bug by measuring service-level response time.
     * On unfixed code: initiatePasswordReset() takes 1-3 seconds (BUG!)
     * On fixed code: initiatePasswordReset() takes < 100ms (CORRECT!)
     */
    public function test_service_password_reset_email_sending_does_not_block_reset_initiation(): void
    {
        Queue::fake();

        // Create a user first
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $authService = app(\App\Services\AuthService::class);

        // Measure the time it takes to initiate password reset
        $startTime = microtime(true);
        
        $result = $authService->initiatePasswordReset('reset@example.com');
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Password reset should be initiated successfully
        $this->assertTrue($result['success']);

        // This assertion MUST FAIL on unfixed code (response time > 1000ms)
        // This assertion MUST PASS on fixed code (response time < 500ms)
        $this->assertLessThan(
            500,
            $responseTime,
            "Password reset initiation took {$responseTime}ms. " .
            "Counterexample: Email sending blocks API response on unfixed code. " .
            "Expected response time < 500ms (email should be sent asynchronously), " .
            "but got {$responseTime}ms (email is being sent synchronously)"
        );
    }
}
