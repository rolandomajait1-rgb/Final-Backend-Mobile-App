<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PreservationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Property 2: Preservation - Public and Non-Authenticated Requests
     * 
     * These tests verify that existing behavior for public endpoints, rate limiting,
     * invalid tokens, and cross-origin blocking is preserved after the fix.
     */

    // Requirement 3.1: Public endpoints work without authentication
    public function test_public_articles_endpoint_works_without_authentication()
    {
        $response = $this->getJson('/api/articles/public');
        $response->assertStatus(200);
        $response->assertJsonStructure(['data']);
    }

    public function test_public_categories_endpoint_works_without_authentication()
    {
        $response = $this->getJson('/api/categories');
        $response->assertStatus(200);
    }

    public function test_public_tags_endpoint_works_without_authentication()
    {
        $response = $this->getJson('/api/tags');
        $response->assertStatus(200);
    }

    public function test_public_authors_endpoint_works_without_authentication()
    {
        $response = $this->getJson('/api/authors');
        $response->assertStatus(200);
    }

    // Requirement 3.2: Rate limiting is enforced on protected endpoints
    public function test_login_endpoint_has_rate_limiting()
    {
        // Make multiple login attempts to trigger rate limiting
        for ($i = 0; $i < 11; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => 'test@example.com',
                'password' => 'password',
            ]);
            
            // After 10 requests, should be rate limited
            if ($i >= 10) {
                $this->assertEquals(429, $response->getStatusCode());
                break;
            }
        }
    }

    public function test_register_endpoint_has_rate_limiting()
    {
        // Make multiple register attempts to trigger rate limiting
        for ($i = 0; $i < 11; $i++) {
            $response = $this->postJson('/api/register', [
                'name' => 'Test User',
                'email' => "test{$i}@example.com",
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);
            
            // After 10 requests, should be rate limited
            if ($i >= 10) {
                $this->assertEquals(429, $response->getStatusCode());
                break;
            }
        }
    }

    // Requirement 3.3: Invalid tokens return 401 Unauthorized
    public function test_invalid_bearer_token_returns_401()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer invalid-token-12345',
            'Accept' => 'application/json',
        ])->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_expired_token_returns_401()
    {
        // Create a user and token, then manually expire it
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;
        
        // Simulate an expired token by using a malformed one
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . substr($token, 0, -5) . 'xxxxx',
            'Accept' => 'application/json',
        ])->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_missing_bearer_token_returns_401_for_protected_endpoint()
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }

    // Requirement 3.4: Disallowed origins are blocked
    public function test_disallowed_origin_cors_request()
    {
        $response = $this->withHeaders([
            'Origin' => 'http://malicious-site.com',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/user');

        // CORS should not include the disallowed origin in the response
        $allowedOrigin = $response->headers->get('Access-Control-Allow-Origin');
        $this->assertNotEquals('http://malicious-site.com', $allowedOrigin);
    }

    // Requirement 3.5: Development origin is allowed
    public function test_localhost_5173_origin_is_allowed()
    {
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'Authorization',
        ])->options('/api/user');

        $this->assertEquals(
            'http://localhost:5173',
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    public function test_vercel_preview_domain_is_allowed()
    {
        $response = $this->withHeaders([
            'Origin' => 'https://my-app-preview.vercel.app',
            'Access-Control-Request-Method' => 'GET',
        ])->options('/api/user');

        $this->assertEquals(
            'https://my-app-preview.vercel.app',
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    // Additional preservation tests
    public function test_health_check_endpoint_works()
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200);
    }

    public function test_team_members_public_endpoint_works()
    {
        $response = $this->getJson('/api/team-members');
        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_access_protected_endpoint()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ])->getJson('/api/user');

        $response->assertStatus(200);
        $response->assertJsonStructure(['id', 'email']);
    }
}
