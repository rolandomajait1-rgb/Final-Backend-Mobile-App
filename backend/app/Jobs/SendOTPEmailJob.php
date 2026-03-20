<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\MailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendOTPEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private User $user,
        private string $otp
    ) {
        $this->onQueue('default');
    }

    /**
     * Execute the job.
     */
    public function handle(MailService $mailService): void
    {
        try {
            $mailService->sendOTPEmailSync($this->user, $this->otp);
        } catch (\Exception $e) {
            Log::error('SendOTPEmailJob failed', [
                'user_id' => $this->user->id,
                'user_email' => $this->user->email,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            // Re-throw to trigger retry logic
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('SendOTPEmailJob permanently failed', [
            'user_id' => $this->user->id,
            'user_email' => $this->user->email,
            'error' => $exception->getMessage(),
        ]);
    }
}
