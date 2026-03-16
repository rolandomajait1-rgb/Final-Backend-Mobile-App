<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test user for login testing
        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make(env('TEST_USER_PASSWORD', 'password123')),
                'role' => 'user',
            ]
        );

        // Create an admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make(env('ADMIN_PASSWORD', 'admin123')),
                'role' => 'admin',
            ]
        );
        // Create author record for admin
        $admin->author()->firstOrCreate(['bio' => 'Administrator bio']);

        // Create a moderator user
        User::firstOrCreate(
            ['email' => 'moderator@example.com'],
            [
                'name' => 'Moderator User',
                'password' => Hash::make(env('MODERATOR_PASSWORD', 'moderator123')),
                'role' => 'moderator',
            ]
        );
    }
}
