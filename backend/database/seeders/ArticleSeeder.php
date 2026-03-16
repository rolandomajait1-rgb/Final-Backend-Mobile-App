<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Author;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create an author
        $admin = User::where('email', 'admin@example.com')->first();
        if (!$admin) {
            return; // Skip if admin doesn't exist
        }

        $author = $admin->author;
        if (!$author) {
            $author = Author::create([
                'user_id' => $admin->id,
                'bio' => 'Administrator and chief editor',
            ]);
        }

        // Get categories and tags
        $categories = Category::all();
        $tags = Tag::all();

        if ($categories->isEmpty() || $tags->isEmpty()) {
            return; // Skip if no categories or tags
        }

        // Create sample articles
        $articles = [
            [
                'title' => 'Welcome to La Verdad Herald',
                'slug' => 'welcome-to-la-verdad-herald',
                'excerpt' => 'Introducing the official student publication of La Verdad Christian College.',
                'content' => '<p>We are proud to launch La Verdad Herald, the official student publication dedicated to bringing you the latest news, stories, and insights from our campus community.</p><p>Our mission is to inform, inspire, and engage students, faculty, and staff through quality journalism and compelling storytelling.</p>',
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now()->subDays(7),
            ],
            [
                'title' => 'Campus Events This Month',
                'slug' => 'campus-events-this-month',
                'excerpt' => 'A roundup of exciting events happening on campus this month.',
                'content' => '<p>From academic seminars to cultural festivals, there\'s something for everyone this month. Check out our comprehensive guide to upcoming campus events.</p>',
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => 'Student Research Spotlight',
                'slug' => 'student-research-spotlight',
                'excerpt' => 'Highlighting outstanding research projects by our students.',
                'content' => '<p>Our students continue to excel in research across various disciplines. This month, we spotlight three exceptional projects that showcase innovation and academic excellence.</p>',
                'status' => 'published',
                'is_featured' => true,
                'published_at' => now()->subDays(3),
            ],
            [
                'title' => 'Faculty Interview: Dr. Maria Santos',
                'slug' => 'faculty-interview-dr-maria-santos',
                'excerpt' => 'An exclusive interview with our distinguished faculty member.',
                'content' => '<p>We sit down with Dr. Maria Santos to discuss her journey in academia, her research interests, and her vision for student success.</p>',
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(2),
            ],
            [
                'title' => 'Tips for Academic Success',
                'slug' => 'tips-for-academic-success',
                'excerpt' => 'Practical advice to help you excel in your studies.',
                'content' => '<p>From time management to study techniques, we share proven strategies to help you achieve your academic goals this semester.</p>',
                'status' => 'published',
                'is_featured' => false,
                'published_at' => now()->subDays(1),
            ],
        ];

        foreach ($articles as $articleData) {
            $article = Article::firstOrCreate(
                ['slug' => $articleData['slug']],
                array_merge($articleData, [
                    'author_id' => $author->id,
                    'author_name' => $admin->name,
                ])
            );

            // Attach random categories (1-2 per article)
            $article->categories()->sync(
                $categories->random(rand(1, 2))->pluck('id')->toArray()
            );

            // Attach random tags (2-4 per article)
            $article->tags()->sync(
                $tags->random(rand(2, 4))->pluck('id')->toArray()
            );
        }
    }
}
