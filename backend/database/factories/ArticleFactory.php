<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Article>
 */
class ArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(),
            'excerpt' => $this->faker->paragraph(),
            'content' => $this->faker->paragraphs(5, true),
            'featured_image' => $this->faker->imageUrl(),
            'status' => $this->faker->randomElement(['published', 'draft', 'archived']),
            'published_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'author_id' => \App\Models\Author::factory(),
        ];
    }
}
