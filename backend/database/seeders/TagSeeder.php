<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tags = [
            'Breaking News',
            'Campus Life',
            'Student Affairs',
            'Faculty',
            'Research',
            'Events',
            'Announcements',
            'Editorial',
            'Interview',
            'Profile',
            'Investigation',
            'Analysis',
            'Commentary',
            'Review',
            'Tutorial',
            'Guide',
            'Tips',
            'Trending',
            'Viral',
            'Exclusive',
        ];

        foreach ($tags as $tagName) {
            Tag::firstOrCreate(
                ['name' => $tagName],
                ['slug' => \Illuminate\Support\Str::slug($tagName)]
            );
        }
    }
}
