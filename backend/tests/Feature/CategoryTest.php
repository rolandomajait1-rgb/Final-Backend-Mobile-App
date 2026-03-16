<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Public Index
    // -------------------------------------------------------------------------

    public function test_public_categories_returns_all_categories(): void
    {
        Category::factory()->count(5)->create();

        $this->getJson('/api/categories')
            ->assertStatus(200);
    }

    public function test_public_categories_returns_json_array(): void
    {
        Category::factory()->count(3)->create();

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200);
        $this->assertIsArray($response->json());
    }

    public function test_public_categories_returns_empty_array_when_none_exist(): void
    {
        $response = $this->getJson('/api/categories');

        $response->assertStatus(200);
        $this->assertEmpty($response->json());
    }

    // -------------------------------------------------------------------------
    // Articles by Category
    // -------------------------------------------------------------------------

    public function test_get_articles_by_category_returns_only_published(): void
    {
        $category = Category::factory()->create();
        $published = Article::factory()->create(['status' => 'published', 'published_at' => now()]);
        $draft     = Article::factory()->create(['status' => 'draft']);
        $published->categories()->attach($category->id);
        $draft->categories()->attach($category->id);

        $response = $this->getJson("/api/categories/{$category->id}/articles");

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($published->id));
        $this->assertFalse($ids->contains($draft->id));
    }

    public function test_get_articles_by_category_returns_404_for_missing_category(): void
    {
        $this->getJson('/api/categories/99999/articles')->assertStatus(404);
    }

    // -------------------------------------------------------------------------
    // RBAC — Create
    // -------------------------------------------------------------------------

    public function test_unauthenticated_user_cannot_create_category(): void
    {
        $this->postJson('/api/categories', ['name' => 'Sports'])->assertStatus(401);
    }

    public function test_regular_user_cannot_create_category(): void
    {
        $user  = User::factory()->create(['role' => 'user']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/categories', ['name' => 'Sports'])
            ->assertStatus(403);
    }

    public function test_admin_can_create_category(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/categories', [
            'name'        => 'Technology',
            'description' => 'Tech news',
        ]);

        $response->assertStatus(201)->assertJsonFragment(['name' => 'Technology']);
        $this->assertDatabaseHas('categories', ['name' => 'Technology']);
    }

    public function test_moderator_can_create_category(): void
    {
        $mod   = User::factory()->create(['role' => 'moderator']);
        $token = $mod->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/categories', [
            'name' => 'Campus Life',
        ]);

        $response->assertStatus(201);
    }

    public function test_create_category_generates_slug_automatically(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/categories', ['name' => 'Campus Events']);

        $this->assertDatabaseHas('categories', ['slug' => 'campus-events']);
    }

    public function test_create_category_rejects_duplicate_name(): void
    {
        Category::factory()->create(['name' => 'Sports']);
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/categories', ['name' => 'Sports'])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('name');
    }

    public function test_create_category_requires_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/categories', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('name');
    }

    // -------------------------------------------------------------------------
    // RBAC — Update
    // -------------------------------------------------------------------------

    public function test_admin_can_update_category(): void
    {
        $admin    = User::factory()->create(['role' => 'admin']);
        $token    = $admin->createToken('test')->plainTextToken;
        $category = Category::factory()->create(['name' => 'Old Name']);

        $this->withToken($token)->putJson("/api/categories/{$category->id}", [
            'name' => 'New Name',
        ])->assertStatus(200)->assertJsonFragment(['name' => 'New Name']);
    }

    public function test_regular_user_cannot_update_category(): void
    {
        $user     = User::factory()->create(['role' => 'user']);
        $token    = $user->createToken('test')->plainTextToken;
        $category = Category::factory()->create();

        $this->withToken($token)->putJson("/api/categories/{$category->id}", [
            'name' => 'Hacked',
        ])->assertStatus(403);
    }

    // -------------------------------------------------------------------------
    // RBAC — Delete
    // -------------------------------------------------------------------------

    public function test_admin_can_delete_category(): void
    {
        $admin    = User::factory()->create(['role' => 'admin']);
        $token    = $admin->createToken('test')->plainTextToken;
        $category = Category::factory()->create();

        $this->withToken($token)->deleteJson("/api/categories/{$category->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_regular_user_cannot_delete_category(): void
    {
        $user     = User::factory()->create(['role' => 'user']);
        $token    = $user->createToken('test')->plainTextToken;
        $category = Category::factory()->create();

        $this->withToken($token)->deleteJson("/api/categories/{$category->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_delete_nonexistent_category_returns_404(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->deleteJson('/api/categories/99999')->assertStatus(404);
    }
}
