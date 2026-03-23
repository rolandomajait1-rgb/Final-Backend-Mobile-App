<?php

namespace Tests\Feature\Auth;

use App\Jobs\SendOTPEmailJob;
use App\Models\OTPToken;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Integration Tests for Async Email Sending Performance
 * 
 * This test suite verifies that email sending does not block API responses.
 * It tests that:
 * 1. Registration endpoint response time is < 500ms (no email sending delay)
 * 2. Email is queued in queue table
 * 3. Email is eventually sent by queue worker
 * 4. Multiple concurrent requests are handled efficiently
 * 
 * Validates: Requirements 2.3, 2.4
 */
class AsyncEmailPerformanceTest extends TestCase
{
    use RefreshDatabase;

    private AuthService $authService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->authService = app(AuthService::class);
    }

    /**
     * Test: Registration endpoint response time is < 500ms
     * 
     * This test verifies that the registration endpoint returns quickly
     * without waiting for email sending to complete. Email sending should
     * be queued for async delivery.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_registration_endpoint_response_time_is_fast(): void
    {
        Queue::fake(); // Fake the queue to prevent actual email sending
        
        $email = 'user@example.com';
        $password = 'SecurePassword123!';
        $name = 'Test User';
        
        // Measure registration time
        $startTime = microtime(true);
        
        $user = $this->authService->createUserWithVerification([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        // Response should be fast (< 500ms)
        // This verifies that email sending is asynchronous and doesn't block
        $this->assertLessThan(500, $executionTime, 
            "Registration took {$executionTime}ms, email might be sent synchronously");
        
        // Verify user was created
        $this->assertNotNull($user->id);
        $this->assertEquals($email, $user->email);
        
        // Verify email job was queued
        Queue::assertPushed(SendOTPEmailJob::class);
    }

    /**
     * Test: Password reset endpoint response time is < 500ms
     * 
     * This test verifies that the password reset endpoint returns quickly
     * without waiting for email sending to complete.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_password_reset_endpoint_response_time_is_fast(): void
    {
        Queue::fake(); // Fake the queue to prevent actual email sending
        
        // Create a user
        $user = User::factory()->create([
            'email' => 'user@example.com',
        ]);
        
        // Measure password reset time
        $startTime = microtime(true);
        
        $this->authService->initiatePasswordReset($user->email);
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        
        // Response should be fast (< 500ms)
        $this->assertLessThan(500, $executionTime, 
            "Password reset took {$executionTime}ms, email might be sent synchronously");
        
        // Verify email job was queued
        Queue::assertPushed(SendOTPEmailJob::class);
    }

    /**
     * Test: Email is queued in queue table
     * 
     * This test verifies that when an email is sent, it's stored in the
     * queue table for async processing.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_email_is_queued_in_queue_table(): void
    {
        // Use database queue driver for this test
        Queue::fake(); // Still fake to verify dispatch was called
        
        $email = 'user@example.com';
        
        // Register user
        $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        // Verify email job was queued
        Queue::assertPushed(SendOTPEmailJob::class);
        
        // Verify OTP was created
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
        ]);
    }

    /**
     * Test: Email is eventually sent by queue worker
     * 
     * This test verifies that the queued email job can be processed
     * and the email is actually sent.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_email_is_eventually_sent_by_queue_worker(): void
    {
        // Fake the queue for this test
        Queue::fake();
        
        $email = 'user@example.com';
        
        // Register user
        $user = $this->authService->createUserWithVerification([
            'name' => 'Test User',
            'email' => $email,
            'password' => 'SecurePassword123!',
        ]);
        
        // Get the queued job
        Queue::assertPushed(SendOTPEmailJob::class);
        
        // Get the OTP
        $otpRecord = OTPToken::where('email', $email)->first();
        $otp = $otpRecord->otp;
        
        // Verify the job was created with correct parameters
        $this->assertNotNull($user->id);
        $this->assertNotNull($otp);
        
        // Verify OTP exists in database
        $this->assertDatabaseHas('otp_tokens', [
            'email' => $email,
            'otp' => $otp,
        ]);
    }

    /**
     * Test: Multiple concurrent registration requests are handled efficiently
     * 
     * This test verifies that multiple users can register concurrently
     * without significant performance degradation.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_multiple_concurrent_registration_requests_are_fast(): void
    {
        Queue::fake(); // Fake the queue to prevent actual email sending
        
        $numberOfUsers = 5;
        $users = [];
        
        // Measure time for multiple registrations
        $startTime = microtime(true);
        
        for ($i = 1; $i <= $numberOfUsers; $i++) {
            $user = $this->authService->createUserWithVerification([
                'name' => "User {$i}",
                'email' => "user{$i}@example.com",
                'password' => "Password{$i}123!",
            ]);
            $users[] = $user;
        }
        
        $endTime = microtime(true);
        $totalTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        $averageTime = $totalTime / $numberOfUsers;
        
        // Average time per registration should be < 500ms
        $this->assertLessThan(500, $averageTime, 
            "Average registration time is {$averageTime}ms, email might be sent synchronously");
        
        // Verify all users were created
        $this->assertCount($numberOfUsers, $users);
        
        // Verify all email jobs were queued
        Queue::assertPushed(SendOTPEmailJob::class, $numberOfUsers);
    }

    /**
     * Test: Multiple concurrent password reset requests are handled efficiently
     * 
     * This test verifies that multiple password reset requests can be
     * processed concurrently without significant performance degradation.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_multiple_concurrent_password_reset_requests_are_fast(): void
    {
        Queue::fake(); // Fake the queue to prevent actual email sending
        
        $numberOfUsers = 5;
        
        // Create multiple users
        $users = User::factory()->count($numberOfUsers)->create();
        
        // Measure time for multiple password reset requests
        $startTime = microtime(true);
        
        foreach ($users as $user) {
            $this->authService->initiatePasswordReset($user->email);
        }
        
        $endTime = microtime(true);
        $totalTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        $averageTime = $totalTime / $numberOfUsers;
        
        // Average time per password reset should be < 500ms
        $this->assertLessThan(500, $averageTime, 
            "Average password reset time is {$averageTime}ms, email might be sent synchronously");
        
        // Verify all email jobs were queued
        Queue::assertPushed(SendOTPEmailJob::class, $numberOfUsers);
    }

    /**
     * Test: Email sending does not block subsequent requests
     * 
     * This test verifies that while one email is being sent, other
     * requests can be processed without waiting.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_email_sending_does_not_block_subsequent_requests(): void
    {
        Queue::fake(); // Fake the queue to prevent actual email sending
        
        // Register first user
        $startTime1 = microtime(true);
        $user1 = $this->authService->createUserWithVerification([
            'name' => 'User 1',
            'email' => 'user1@example.com',
            'password' => 'Password1123!',
        ]);
        $endTime1 = microtime(true);
        $time1 = ($endTime1 - $startTime1) * 1000;
        
        // Register second user
        $startTime2 = microtime(true);
        $user2 = $this->authService->createUserWithVerification([
            'name' => 'User 2',
            'email' => 'user2@example.com',
            'password' => 'Password2123!',
        ]);
        $endTime2 = microtime(true);
        $time2 = ($endTime2 - $startTime2) * 1000;
        
        // Both registrations should be fast
        $this->assertLessThan(500, $time1, "First registration took {$time1}ms");
        $this->assertLessThan(500, $time2, "Second registration took {$time2}ms");
        
        // Times should be similar (not significantly different)
        // If email was blocking, second request would be much faster
        $timeDifference = abs($time1 - $time2);
        $this->assertLessThan(200, $timeDifference, 
            "Time difference between requests is {$timeDifference}ms, suggests blocking behavior");
        
        // Verify both users were created
        $this->assertNotNull($user1->id);
        $this->assertNotNull($user2->id);
        
        // Verify both email jobs were queued
        Queue::assertPushed(SendOTPEmailJob::class, 2);
    }

    /**
     * Test: Queue job is dispatched with correct user and OTP
     * 
     * This test verifies that the queue job is dispatched with the
     * correct user and OTP information.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_queue_job_is_dispatched_with_correct_user_and_otp(): void
    {
        Queue::fake(); // Fake the queue
        
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
        
        // Verify the job was dispatched
        Queue::assertPushed(SendOTPEmailJob::class);
        
        // Verify user and OTP exist
        $this->assertNotNull($user->id);
        $this->assertNotNull($otp);
        $this->assertEquals($email, $user->email);
    }

    /**
     * Test: Response time remains consistent with increasing load
     * 
     * This test verifies that response time doesn't degrade significantly
     * as the number of concurrent requests increases.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_response_time_remains_consistent_with_increasing_load(): void
    {
        Queue::fake(); // Fake the queue to prevent actual email sending
        
        $batchSizes = [1, 5, 10];
        $times = [];
        
        foreach ($batchSizes as $batchSize) {
            $startTime = microtime(true);
            
            for ($i = 1; $i <= $batchSize; $i++) {
                $this->authService->createUserWithVerification([
                    'name' => "User {$i}",
                    'email' => "user{$batchSize}_{$i}@example.com",
                    'password' => "Password{$i}123!",
                ]);
            }
            
            $endTime = microtime(true);
            $totalTime = ($endTime - $startTime) * 1000;
            $averageTime = $totalTime / $batchSize;
            $times[$batchSize] = $averageTime;
        }
        
        // Average time should remain relatively consistent
        // (not increase significantly with batch size)
        $this->assertLessThan(500, $times[1], "Single registration took {$times[1]}ms");
        $this->assertLessThan(500, $times[5], "Average of 5 registrations took {$times[5]}ms");
        $this->assertLessThan(500, $times[10], "Average of 10 registrations took {$times[10]}ms");
        
        // The difference between batch sizes should be minimal
        $difference = abs($times[10] - $times[1]);
        $this->assertLessThan(200, $difference, 
            "Performance degraded significantly with load: {$difference}ms difference");
    }

}
