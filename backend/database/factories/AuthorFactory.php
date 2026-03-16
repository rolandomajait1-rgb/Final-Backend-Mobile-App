<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Author>
 */
class AuthorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'bio' => $this->faker->paragraph(),
            'website' => $this->faker->url(),
            'social_links' => json_encode([
                'twitter' => $this->faker->url(),
                'linkedin' => $this->faker->url(),
            ]),
        ];
    }
}
