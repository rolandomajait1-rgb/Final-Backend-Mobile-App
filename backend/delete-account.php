<?php
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Delete all users (clears all registered accounts)
DB::table('users')->delete();
DB::table('verification_tokens')->delete();
DB::table('password_reset_tokens')->delete();
DB::table('personal_access_tokens')->delete();

echo "✓ All accounts deleted from SQLite database\n";
