<?php
/**
 * Local Testing Script
 * Tests core functionality before deployment
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Category;
use App\Models\Tag;
use App\Models\Author;

echo "\n╔════════════════════════════════════════════════════════════╗\n";
echo "║         LOCAL TESTING - LA VERDAD HERALD BACKEND            ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// Test 1: Database Connection
echo "TEST 1: Database Connection\n";
try {
    \DB::connection()->getPdo();
    echo "✓ PASS: Database connected\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Create Test User
echo "TEST 2: Create Test User\n";
try {
    $user = User::where('email', 'admin@test.com')->first();
    if (!$user) {
        $user = User::create([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin'
        ]);
        $user->markEmailAsVerified();
    }
    echo "✓ PASS: User created/exists - " . $user->email . "\n";
    echo "  - Role: " . $user->role . "\n";
    echo "  - Email verified: " . ($user->email_verified_at ? 'Yes' : 'No') . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 3: Create Test Category
echo "TEST 3: Create Test Category\n";
try {
    $category = Category::where('name', 'Test Category')->first();
    if (!$category) {
        $category = Category::create([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'description' => 'Test category for testing'
        ]);
    }
    echo "✓ PASS: Category created/exists - " . $category->name . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 4: Create Test Author
echo "TEST 4: Create Test Author\n";
try {
    $author = Author::where('user_id', $user->id)->first();
    if (!$author) {
        $author = Author::create([
            'user_id' => $user->id,
            'bio' => 'Test author bio',
            'website' => 'https://example.com'
        ]);
    }
    echo "✓ PASS: Author created/exists\n";
    echo "  - User: " . $author->user->name . "\n";
    echo "  - Bio: " . $author->bio . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 5: Create Test Article
echo "TEST 5: Create Test Article\n";
try {
    $article = \App\Models\Article::where('title', 'Test Article')->first();
    if (!$article) {
        $article = \App\Models\Article::create([
            'title' => 'Test Article',
            'slug' => 'test-article',
            'content' => 'This is test content for the article.',
            'excerpt' => 'Test excerpt',
            'author_id' => $author->id,
            'author_name' => $user->name,
            'status' => 'published',
            'published_at' => now()
        ]);
        $article->categories()->attach($category->id);
    }
    echo "✓ PASS: Article created/exists - " . $article->title . "\n";
    echo "  - Status: " . $article->status . "\n";
    echo "  - Author: " . $article->author->user->name . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 6: Test User Authentication
echo "TEST 6: User Authentication\n";
try {
    $token = $user->createToken('test-token')->plainTextToken;
    echo "✓ PASS: Authentication token created\n";
    echo "  - Token length: " . strlen($token) . " characters\n";
    echo "  - Token starts with: " . substr($token, 0, 10) . "...\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 7: Test Constants
echo "TEST 7: Test UserRole Constants\n";
try {
    $roles = \App\Constants\UserRole::all();
    echo "✓ PASS: UserRole constants loaded\n";
    echo "  - Available roles: " . implode(', ', $roles) . "\n";
    echo "  - Is 'admin' valid: " . (\App\Constants\UserRole::isValid('admin') ? 'Yes' : 'No') . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 8: Test Pagination Helper
echo "TEST 8: Test PaginationHelper\n";
try {
    $limit = \App\Http\Helpers\PaginationHelper::validateLimit(50);
    $page = \App\Http\Helpers\PaginationHelper::validatePage(1);
    echo "✓ PASS: PaginationHelper working\n";
    echo "  - Validated limit: " . $limit . "\n";
    echo "  - Validated page: " . $page . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 9: Test Database Migrations
echo "TEST 9: Database Migrations\n";
try {
    $migrations = \DB::table('migrations')->count();
    echo "✓ PASS: Migrations table exists\n";
    echo "  - Total migrations: " . $migrations . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 10: Test Configuration
echo "TEST 10: Configuration\n";
try {
    $appName = config('app.name');
    $appEnv = config('app.env');
    $appDebug = config('app.debug');
    echo "✓ PASS: Configuration loaded\n";
    echo "  - App name: " . $appName . "\n";
    echo "  - Environment: " . $appEnv . "\n";
    echo "  - Debug mode: " . ($appDebug ? 'On' : 'Off') . "\n\n";
} catch (\Exception $e) {
    echo "✗ FAIL: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Summary
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║                    ALL TESTS PASSED ✓                      ║\n";
echo "║                                                            ║\n";
echo "║  The application is ready for deployment!                 ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

exit(0);
