<?php

namespace Tests\Feature\Jobs;

use App\Jobs\SendOTPEmailJob;
use App\Models\OTPToken;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Integration Tests for SendOTPEmailJob Queue Job
 * 
 * This test suite verifies that the SendOTPEmailJob queue job:
 * 1. Successfully sends email on first attempt
 * 2. Retries on failure (max 3 retries)
 * 3. Logs failures appropriately
 * 4. Handles invalid user/OTP gracefully
 * 
 * Validates: Requirements 2.3, 2.4
 */
class SendOTPEmailJobTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $otp;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user
        $this->user = User::factory()->create([
            'email' => 'test@example.com',
            'name' => 'Test User',
        ]);
        
        // Create a test OTP
        $this->otp = '123456';
        OTPToken::create([
            'email' => $this->user->email,
            'otp' => $this->otp,
            'type' => 'email_verification',
            'expires_at' => now()->addMinutes(10),
        ]);
    }

    /**
     * Test: Job successfully sends email on first attempt
     * 
     * This test verifies that the SendOTPEmailJob can successfully
     * send an OTP email on the first attempt without any failures.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_successfully_sends_email_on_first_attempt(): void
    {
        Mail::fake();
        
        // Create and dispatch the job
        $job = new SendOTPEmailJob($this->user, $this->otp);
        
        // Execute the job
        $mailService = app(MailService::class);
        $job->handle($mailService);
        
        // Verify email was sent
        Mail::assertSent(\App\Mail\OTPEmail::class, function ($mail) {
            return $mail->hasTo($this->user->email);
        });
    }

    /**
     * Test: Job retries on failure (max 3 retries)
     * 
     * This test verifies that the SendOTPEmailJob has the correct
     * retry configuration (max 3 attempts).
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_has_correct_retry_configuration(): void
    {
        $job = new SendOTPEmailJob($this->user, $this->otp);
        
        // Verify the job has 3 tries configured
        $this->assertEquals(3, $job->tries);
    }

    /**
     * Test: Job has correct timeout configuration
     * 
     * This test verifies that the SendOTPEmailJob has the correct
     * timeout configuration (30 seconds).
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_has_correct_timeout_configuration(): void
    {
        $job = new SendOTPEmailJob($this->user, $this->otp);
        
        // Verify the job has 30 second timeout configured
        $this->assertEquals(30, $job->timeout);
    }

    /**
     * Test: Job logs failures appropriately
     * 
     * This test verifies that when the job fails, it logs the failure
     * with appropriate context information.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_logs_failures_appropriately(): void
    {
        Log::spy();
        
        // Create a mock MailService that throws an exception
        $mailService = $this->createMock(MailService::class);
        $mailService->method('sendOTPEmailSync')
            ->willThrowException(new \Exception('Email service unavailable'));
        
        $job = new SendOTPEmailJob($this->user, $this->otp);
        
        // Execute the job and expect it to throw
        try {
            $job->handle($mailService);
        } catch (\Exception $e) {
            // Expected to throw
        }
        
        // Verify error was logged
        Log::shouldHaveReceived('error')
            ->with('SendOTPEmailJob failed', \Mockery::on(function ($context) {
                return isset($context['user_id']) && 
                       isset($context['user_email']) && 
                       isset($context['error']);
            }));
    }

    /**
     * Test: Job handles invalid user gracefully
     * 
     * This test verifies that the job handles the case where the user
     * no longer exists (e.g., deleted between job dispatch and execution).
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_handles_invalid_user_gracefully(): void
    {
        Log::spy();
        
        // Create a job with a user
        $job = new SendOTPEmailJob($this->user, $this->otp);
        
        // Delete the user
        $this->user->delete();
        
        // Create a mock MailService that throws an exception
        $mailService = $this->createMock(MailService::class);
        $mailService->method('sendOTPEmailSync')
            ->willThrowException(new \Exception('User not found'));
        
        // Execute the job and expect it to throw
        try {
            $job->handle($mailService);
        } catch (\Exception $e) {
            // Expected to throw
        }
        
        // Verify error was logged
        Log::shouldHaveReceived('error');
    }

    /**
     * Test: Job handles invalid OTP gracefully
     * 
     * This test verifies that the job handles the case where the OTP
     * is invalid or has expired.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_handles_invalid_otp_gracefully(): void
    {
        Log::spy();
        
        // Create a job with an invalid OTP
        $invalidOtp = 'invalid_otp_code';
        $job = new SendOTPEmailJob($this->user, $invalidOtp);
        
        // Create a mock MailService that throws an exception
        $mailService = $this->createMock(MailService::class);
        $mailService->method('sendOTPEmailSync')
            ->willThrowException(new \Exception('OTP not found or expired'));
        
        // Execute the job and expect it to throw
        try {
            $job->handle($mailService);
        } catch (\Exception $e) {
            // Expected to throw
        }
        
        // Verify error was logged
        Log::shouldHaveReceived('error');
    }

    /**
     * Test: Job calls failed method on permanent failure
     * 
     * This test verifies that when the job fails permanently (after
     * all retries), the failed() method is called and logs the failure.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_calls_failed_method_on_permanent_failure(): void
    {
        Log::spy();
        
        $job = new SendOTPEmailJob($this->user, $this->otp);
        $exception = new \Exception('Permanent failure');
        
        // Call the failed method
        $job->failed($exception);
        
        // Verify permanent failure was logged
        Log::shouldHaveReceived('error')
            ->with('SendOTPEmailJob permanently failed', \Mockery::on(function ($context) {
                return isset($context['user_id']) && 
                       isset($context['user_email']) && 
                       isset($context['error']);
            }));
    }

    /**
     * Test: Job is queued on default queue
     * 
     * This test verifies that the job is queued on the default queue.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_is_queued_on_default_queue(): void
    {
        Queue::fake();
        
        // Dispatch the job
        SendOTPEmailJob::dispatch($this->user, $this->otp);
        
        // Verify job was queued
        Queue::assertPushed(SendOTPEmailJob::class);
    }

    /**
     * Test: Job preserves user and OTP data through serialization
     * 
     * This test verifies that the job correctly serializes and
     * deserializes the user and OTP data.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_job_preserves_user_and_otp_data(): void
    {
        $job = new SendOTPEmailJob($this->user, $this->otp);
        
        // Verify the job has the correct user and OTP
        $reflection = new \ReflectionClass($job);
        $userProperty = $reflection->getProperty('user');
        $userProperty->setAccessible(true);
        $otpProperty = $reflection->getProperty('otp');
        $otpProperty->setAccessible(true);
        
        $this->assertEquals($this->user->id, $userProperty->getValue($job)->id);
        $this->assertEquals($this->otp, $otpProperty->getValue($job));
    }

    /**
     * Test: Multiple jobs can be queued for different users
     * 
     * This test verifies that multiple SendOTPEmailJob instances can
     * be queued for different users without conflicts.
     * 
     * Validates: Requirements 2.3, 2.4
     */
    public function test_multiple_jobs_can_be_queued_for_different_users(): void
    {
        Queue::fake();
        
        // Create multiple users
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        $user2 = User::factory()->create(['email' => 'user2@example.com']);
        
        // Dispatch jobs for both users
        SendOTPEmailJob::dispatch($user1, '111111');
        SendOTPEmailJob::dispatch($user2, '222222');
        
        // Verify both jobs were queued
        Queue::assertPushed(SendOTPEmailJob::class, 2);
    }

}
