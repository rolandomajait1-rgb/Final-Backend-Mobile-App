<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::firstOrCreate(['name' => 'News'], ['slug' => 'news', 'description' => 'News articles']);
        Category::firstOrCreate(['name' => 'Sports'], ['slug' => 'sports', 'description' => 'Sports articles']);
        Category::firstOrCreate(['name' => 'Opinion'], ['slug' => 'opinion', 'description' => 'Opinion pieces']);
        Category::firstOrCreate(['name' => 'Literary'], ['slug' => 'literary', 'description' => 'Literary works']);
        Category::firstOrCreate(['name' => 'Features'], ['slug' => 'features', 'description' => 'Feature articles']);
        Category::firstOrCreate(['name' => 'Specials'], ['slug' => 'specials', 'description' => 'Special reports']);
        Category::firstOrCreate(['name' => 'Art'], ['slug' => 'art', 'description' => 'Art and culture']);
    }
}
