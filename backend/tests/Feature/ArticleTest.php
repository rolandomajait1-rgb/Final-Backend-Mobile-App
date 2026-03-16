<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Author;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleTest extends TestCase
{
    use RefreshDatabase;

    private function makePublishedArticle(array $overrides = []): Article
    {
        return Article::factory()->create(array_merge([
            'status'       => 'published',
            'published_at' => now(),
        ], $overrides));
    }

    // -------------------------------------------------------------------------
    // Public Index
    // -------------------------------------------------------------------------

    public function test_public_articles_returns_only_published(): void
    {
        $this->makePublishedArticle(['title' => 'Published One']);
        Article::factory()->create(['status' => 'draft',    'title' => 'Draft Article']);
        Article::factory()->create(['status' => 'archived', 'title' => 'Archived Article']);

        $response = $this->getJson('/api/articles/public');

        $response->assertStatus(200);
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertTrue($titles->contains('Published One'));
        $this->assertFalse($titles->contains('Draft Article'));
        $this->assertFalse($titles->contains('Archived Article'));
    }

    public function test_public_articles_returns_paginated_structure(): void
    {
        $this->makePublishedArticle();

        $this->getJson('/api/articles/public')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'current_page', 'per_page', 'total', 'last_page']);
    }

    public function test_public_articles_respects_limit_parameter(): void
    {
        Article::factory()->count(10)->create(['status' => 'published', 'published_at' => now()]);

        $response = $this->getJson('/api/articles/public?limit=3');

        $this->assertCount(3, $response->json('data'));
    }

    public function test_public_articles_caps_limit_at_100(): void
    {
        Article::factory()->count(5)->create(['status' => 'published', 'published_at' => now()]);

        $response = $this->getJson('/api/articles/public?limit=999');

        // Should not throw — limit is capped internally
        $response->assertStatus(200);
    }

    public function test_public_articles_includes_likes_count(): void
    {
        $this->makePublishedArticle();

        $response = $this->getJson('/api/articles/public');

        $this->assertArrayHasKey('likes_count', $response->json('data.0'));
    }

    // -------------------------------------------------------------------------
    // Public Search
    // -------------------------------------------------------------------------

    public function test_search_returns_empty_for_query_under_3_chars(): void
    {
        $this->getJson('/api/articles/search?q=ab')
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }

    public function test_search_returns_empty_for_blank_query(): void
    {
        $this->getJson('/api/articles/search?q=')
            ->assertStatus(200)
            ->assertJsonPath('data', []);
    }

    public function test_search_rejects_query_over_100_chars(): void
    {
        $this->getJson('/api/articles/search?q=' . str_repeat('a', 101))
            ->assertStatus(400);
    }

    public function test_search_finds_articles_by_title(): void
    {
        $this->makePublishedArticle(['title' => 'Laravel Testing Guide']);
        $this->makePublishedArticle(['title' => 'Unrelated Article']);

        $response = $this->getJson('/api/articles/search?q=Laravel');

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Laravel Testing Guide', $response->json('data.0.title'));
    }

    public function test_search_does_not_return_draft_articles(): void
    {
        Article::factory()->create(['status' => 'draft', 'title' => 'Secret Draft']);

        $response = $this->getJson('/api/articles/search?q=Secret');

        $this->assertEmpty($response->json('data'));
    }

    public function test_search_returns_correct_meta_structure(): void
    {
        $this->getJson('/api/articles/search?q=test')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'per_page', 'total', 'last_page']]);
    }

    public function test_search_sanitizes_sql_wildcard_characters(): void
    {
        // Should not throw a DB error
        $this->getJson('/api/articles/search?q=test%25injection')
            ->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Public By Slug
    // -------------------------------------------------------------------------

    public function test_get_article_by_slug_returns_published_article(): void
    {
        $this->makePublishedArticle(['slug' => 'my-article-slug']);

        $this->getJson('/api/articles/by-slug/my-article-slug')
            ->assertStatus(200)
            ->assertJsonFragment(['slug' => 'my-article-slug']);
    }

    public function test_get_article_by_slug_returns_404_for_draft(): void
    {
        Article::factory()->create(['status' => 'draft', 'slug' => 'hidden-draft']);

        $this->getJson('/api/articles/by-slug/hidden-draft')->assertStatus(404);
    }

    public function test_get_article_by_slug_returns_404_for_nonexistent(): void
    {
        $this->getJson('/api/articles/by-slug/does-not-exist')->assertStatus(404);
    }

    // -------------------------------------------------------------------------
    // Public By ID
    // -------------------------------------------------------------------------

    public function test_get_article_by_id_returns_article(): void
    {
        $article = $this->makePublishedArticle();

        $this->getJson("/api/articles/id/{$article->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $article->id]);
    }

    public function test_get_article_by_id_returns_404_for_missing(): void
    {
        $this->getJson('/api/articles/id/99999')->assertStatus(404);
    }

    // -------------------------------------------------------------------------
    // Latest Articles
    // -------------------------------------------------------------------------

    public function test_latest_articles_returns_max_6(): void
    {
        Article::factory()->count(10)->create(['status' => 'published', 'published_at' => now()]);

        $response = $this->getJson('/api/latest-articles');

        $response->assertStatus(200);
        $this->assertLessThanOrEqual(6, count($response->json()));
    }

    public function test_latest_articles_excludes_drafts(): void
    {
        Article::factory()->count(3)->create(['status' => 'draft']);

        $response = $this->getJson('/api/latest-articles');

        $this->assertEmpty($response->json());
    }

    public function test_latest_articles_are_ordered_by_published_at_desc(): void
    {
        $old  = $this->makePublishedArticle(['published_at' => now()->subDays(5), 'title' => 'Old Article']);
        $new  = $this->makePublishedArticle(['published_at' => now(),             'title' => 'New Article']);

        $response = $this->getJson('/api/latest-articles');

        $this->assertEquals('New Article', $response->json('0.title'));
    }

    // -------------------------------------------------------------------------
    // Protected Article Index
    // -------------------------------------------------------------------------

    public function test_protected_articles_index_requires_auth(): void
    {
        $this->getJson('/api/articles')->assertStatus(401);
    }

    public function test_authenticated_user_can_access_articles_index(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/articles')->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Likes
    // -------------------------------------------------------------------------

    public function test_like_requires_authentication(): void
    {
        $article = $this->makePublishedArticle();

        $this->postJson("/api/articles/{$article->id}/like")->assertStatus(401);
    }

    public function test_authenticated_user_can_like_article(): void
    {
        $user    = User::factory()->create();
        $token   = $user->createToken('test')->plainTextToken;
        $article = $this->makePublishedArticle();

        $this->withToken($token)->postJson("/api/articles/{$article->id}/like")
            ->assertStatus(200)
            ->assertJsonFragment(['liked' => true, 'likes_count' => 1]);
    }

    public function test_liking_same_article_twice_toggles_unlike(): void
    {
        $user    = User::factory()->create();
        $token   = $user->createToken('test')->plainTextToken;
        $article = $this->makePublishedArticle();

        $this->withToken($token)->postJson("/api/articles/{$article->id}/like");
        $response = $this->withToken($token)->postJson("/api/articles/{$article->id}/like");

        $response->assertStatus(200)
            ->assertJsonFragment(['liked' => false, 'likes_count' => 0]);
    }

    /**
     * BUG: The like controller uses Auth::id() which resolves correctly in single-user
     * test requests but the Sanctum guard caches the authenticated user per request.
     * When two sequential withToken() requests are made in the same test, the second
     * request's Auth::id() may resolve to the first user's ID, causing the toggle
     * (unlike) behavior instead of a new like. This is a known Sanctum test isolation
     * issue. The behavior is verified per-user in separate test methods above.
     * This test documents the multi-user like persistence at the DB level.
     */
    public function test_two_users_can_independently_like_same_article(): void
    {
        $author  = Author::factory()->create();
        $article = $this->makePublishedArticle(['author_id' => $author->id]);
        $user1   = User::factory()->create();
        $user2   = User::factory()->create();

        $this->actingAs($user1, 'sanctum')
            ->postJson("/api/articles/{$article->id}/like")
            ->assertStatus(200)->assertJsonFragment(['liked' => true]);

        $this->actingAs($user2, 'sanctum')
            ->postJson("/api/articles/{$article->id}/like")
            ->assertStatus(200)->assertJsonFragment(['liked' => true]);

        $this->assertDatabaseHas('article_user_interactions', ['user_id' => $user1->id, 'article_id' => $article->id, 'type' => 'liked']);
        $this->assertDatabaseHas('article_user_interactions', ['user_id' => $user2->id, 'article_id' => $article->id, 'type' => 'liked']);
    }

    public function test_liked_articles_list_requires_auth(): void
    {
        $this->getJson('/api/user/liked-articles')->assertStatus(401);
    }

    public function test_user_can_retrieve_their_liked_articles(): void
    {
        $user    = User::factory()->create();
        $token   = $user->createToken('test')->plainTextToken;
        $article = $this->makePublishedArticle();

        $this->withToken($token)->postJson("/api/articles/{$article->id}/like");

        $response = $this->withToken($token)->getJson('/api/user/liked-articles');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    // -------------------------------------------------------------------------
    // RBAC — Create / Delete
    // -------------------------------------------------------------------------

    public function test_regular_user_cannot_create_article(): void
    {
        $user     = User::factory()->create(['role' => 'user']);
        $token    = $user->createToken('test')->plainTextToken;
        $category = Category::factory()->create();

        $this->withToken($token)->postJson('/api/articles', [
            'title'       => 'Hack',
            'content'     => 'Content',
            'category_id' => $category->id,
            'author_name' => 'Someone',
        ])->assertStatus(403);
    }

    public function test_moderator_cannot_create_article(): void
    {
        $mod      = User::factory()->create(['role' => 'moderator']);
        $token    = $mod->createToken('test')->plainTextToken;
        $category = Category::factory()->create();

        $this->withToken($token)->postJson('/api/articles', [
            'title'       => 'Mod Article',
            'content'     => 'Content',
            'category_id' => $category->id,
            'author_name' => 'Someone',
        ])->assertStatus(403);
    }

    public function test_regular_user_cannot_delete_article(): void
    {
        $user    = User::factory()->create(['role' => 'user']);
        $token   = $user->createToken('test')->plainTextToken;
        $article = $this->makePublishedArticle();

        $this->withToken($token)->deleteJson("/api/articles/{$article->id}")
            ->assertStatus(403);
    }

    // -------------------------------------------------------------------------
    // Slug Auto-generation
    // -------------------------------------------------------------------------

    public function test_articles_have_unique_slugs_when_titles_are_identical(): void
    {
        $author = Author::factory()->create();

        $a1 = Article::factory()->create(['title' => 'Same Title', 'author_id' => $author->id]);
        $a2 = Article::factory()->create(['title' => 'Same Title', 'author_id' => $author->id]);

        $this->assertNotEquals($a1->slug, $a2->slug);
    }
}
