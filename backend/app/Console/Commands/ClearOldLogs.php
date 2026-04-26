<?php

namespace App\Console\Commands;

use App\Models\Log;
use Illuminate\Console\Command;

class ClearOldLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:clear {--days=30 : Number of days to keep} {--all : Clear all logs} {--force : Skip confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear old audit logs from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('all')) {
            return $this->clearAllLogs();
        }

        $days = (int) $this->option('days');
        
        if ($days < 1) {
            $this->error('Days must be at least 1');
            return 1;
        }

        return $this->clearOldLogs($days);
    }

    /**
     * Clear all logs
     */
    private function clearAllLogs(): int
    {
        $count = Log::count();

        if ($count === 0) {
            $this->info('No logs to clear.');
            return 0;
        }

        $this->warn("You are about to delete ALL {$count} audit logs!");
        
        if (!$this->option('force') && !$this->confirm('Are you sure you want to continue?')) {
            $this->info('Operation cancelled.');
            return 0;
        }

        Log::truncate();
        
        $this->info("✓ Successfully cleared all {$count} audit logs.");
        return 0;
    }

    /**
     * Clear logs older than specified days
     */
    private function clearOldLogs(int $days): int
    {
        $cutoffDate = now()->subDays($days);
        
        $count = Log::where('created_at', '<', $cutoffDate)->count();

        if ($count === 0) {
            $this->info("No logs older than {$days} days found.");
            return 0;
        }

        $this->warn("Found {$count} logs older than {$days} days (before {$cutoffDate->format('Y-m-d H:i:s')})");
        
        if (!$this->option('force') && !$this->confirm('Do you want to delete these logs?')) {
            $this->info('Operation cancelled.');
            return 0;
        }

        Log::where('created_at', '<', $cutoffDate)->delete();
        
        $this->info("✓ Successfully deleted {$count} old audit logs.");
        $this->info("✓ Kept logs from the last {$days} days.");
        
        return 0;
    }
}
