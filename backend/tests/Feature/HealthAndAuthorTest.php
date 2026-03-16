<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Author;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthAndAuthorTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Health Check
    // -------------------------------------------------------------------------

    public function test_health_check_returns_healthy_status(): void
    {
        $this->getJson('/api/health')
            ->assertStatus(200)
            ->assertJsonFragment(['status' => 'healthy'])
            ->assertJsonStructure(['status', 'timestamp', 'service']);
    }

    public function test_config_check_returns_expected_keys(): void
    {
        $this->getJson('/api/config-check')
            ->assertStatus(200)
            ->assertJsonStructure([
                'mail_mailer',
                'app_env',
                'mail_host',
                'mail_port',
            ]);
    }

    public function test_health_check_is_publicly_accessible(): void
    {
        // No auth required
        $this->getJson('/api/health')->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Public Authors
    // -------------------------------------------------------------------------

    public function test_public_authors_index_returns_paginated_list(): void
    {
        Author::factory()->count(3)->create();

        $this->getJson('/api/authors')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_public_authors_does_not_expose_passwords(): void
    {
        Author::factory()->create();

        $response = $this->getJson('/api/authors');

        $author = $response->json('data.0');
        $this->assertArrayNotHasKey('password', $author);
    }

    public function test_get_author_by_name_returns_author_and_articles(): void
    {
        $user   = User::factory()->create(['name' => 'Maria Santos']);
        $author = Author::factory()->create(['user_id' => $user->id]);
        Article::factory()->create([
            'author_id'    => $author->id,
            'status'       => 'published',
            'published_at' => now(),
        ]);

        $response = $this->getJson('/api/authors/Maria Santos');

        $response->assertStatus(200)
            ->assertJsonStructure(['author', 'articles', 'meta']);
    }

    public function test_get_author_by_name_returns_404_for_nonexistent(): void
    {
        $this->getJson('/api/authors/Nobody Here')->assertStatus(404);
    }

    public function test_public_author_articles_only_shows_published(): void
    {
        $user   = User::factory()->create(['name' => 'Test Author']);
        $author = Author::factory()->create(['user_id' => $user->id]);

        Article::factory()->create(['author_id' => $author->id, 'status' => 'published', 'published_at' => now()]);
        Article::factory()->create(['author_id' => $author->id, 'status' => 'draft']);

        $response = $this->getJson('/api/authors/Test Author');

        // All returned articles should be published
        $statuses = collect($response->json('articles'))->pluck('status');
        $this->assertFalse($statuses->contains('draft'));
    }

    // -------------------------------------------------------------------------
    // Security — Headers & Input
    // -------------------------------------------------------------------------

    public function test_api_returns_json_content_type(): void
    {
        $response = $this->getJson('/api/health');

        $this->assertStringContainsString('application/json', $response->headers->get('Content-Type'));
    }

    public function test_sql_injection_attempt_in_search_does_not_cause_500(): void
    {
        $this->getJson("/api/articles/search?q=' OR '1'='1")
            ->assertStatus(200);
    }

    public function test_xss_payload_in_search_does_not_cause_500(): void
    {
        $this->getJson('/api/articles/search?q=<script>alert(1)</script>')
            ->assertStatus(200);
    }

    public function test_extremely_large_page_number_does_not_crash(): void
    {
        $this->getJson('/api/articles/public?page=999999')->assertStatus(200);
    }

    public function test_negative_limit_is_handled_gracefully(): void
    {
        $this->getJson('/api/articles/public?limit=-5')->assertStatus(200);
    }

    public function test_non_numeric_id_returns_404_or_422(): void
    {
        $response = $this->getJson('/api/articles/id/not-a-number');

        $this->assertContains($response->status(), [404, 422]);
    }

    // -------------------------------------------------------------------------
    // Team Members
    // -------------------------------------------------------------------------

    public function test_team_members_endpoint_is_publicly_accessible(): void
    {
        $this->getJson('/api/team-members')->assertStatus(200);
    }
}
