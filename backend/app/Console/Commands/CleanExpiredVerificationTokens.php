<?php

namespace App\Console\Commands;

use App\Models\VerificationToken;
use Illuminate\Console\Command;

class CleanExpiredVerificationTokens extends Command
{
    protected $signature = 'tokens:clean-expired';

    protected $description = 'Clean up expired email verification tokens';

    public function handle()
    {
        $deleted = VerificationToken::where('expires_at', '<', now())->delete();

        $this->info("Deleted {$deleted} expired verification token(s).");

        return 0;
    }
}
