<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CORSAndAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Property 1: Bug Condition - Authenticated API Requests with Bearer Tokens
     * 
     * This test explores the bug condition where authenticated API requests fail
     * due to missing CORS middleware and conflicting withCredentials configuration.
     * 
     * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
     * DO NOT attempt to fix the test or the code when it fails.
     * 
     * Expected counterexamples on unfixed code:
     * - CORS preflight request returns 404 or missing CORS headers
     * - Authorization header is not included in the actual request
     * - Sanctum token validation fails because preflight request was blocked
     */
    public function test_cors_preflight_request_from_frontend_origin()
    {
        // Simulate OPTIONS preflight request from http://localhost:5173 to /api/user
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'Authorization',
        ])->options('/api/user');

        // Assert response includes proper CORS headers (204 is acceptable for preflight)
        $this->assertTrue(in_array($response->getStatusCode(), [200, 204]));
        $this->assertEquals(
            'http://localhost:5173',
            $response->headers->get('Access-Control-Allow-Origin'),
            'CORS preflight should allow origin http://localhost:5173'
        );
        $this->assertStringContainsString(
            'Authorization',
            $response->headers->get('Access-Control-Allow-Headers') ?? '',
            'CORS preflight should allow Authorization header'
        );
    }

    public function test_bearer_token_authentication_from_frontend_origin()
    {
        // Create a test user and generate a token
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        // Simulate GET request to /api/user with Bearer token from http://localhost:5173
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ])->get('/api/user');

        // Assert request succeeds with 200 status
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'id',
            'email',
            'name',
        ]);
    }

    public function test_protected_resource_access_with_bearer_token()
    {
        // Create a test user and generate a token
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        // Simulate POST request to /api/articles/drafts with Bearer token from http://localhost:5173
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ])->post('/api/drafts', [
            'title' => 'Test Draft',
            'content' => 'Test content',
        ]);

        // Assert request is processed (either 201 Created, 422 Unprocessable Entity, or 403 Forbidden for role)
        $this->assertTrue(in_array($response->getStatusCode(), [201, 422, 403]));
    }

    public function test_cors_headers_present_in_authenticated_request()
    {
        // Create a test user and generate a token
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        // Make authenticated request from frontend origin
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ])->get('/api/user');

        // Assert CORS headers are present in response
        $this->assertNotNull(
            $response->headers->get('Access-Control-Allow-Origin'),
            'Response should include Access-Control-Allow-Origin header'
        );
        $this->assertEquals(
            'http://localhost:5173',
            $response->headers->get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Origin should match request origin'
        );
    }

    public function test_invalid_token_returns_401()
    {
        // Simulate request with invalid Bearer token
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Authorization' => 'Bearer invalid-token-12345',
            'Accept' => 'application/json',
        ])->get('/api/user');

        // Assert request returns 401 Unauthorized
        $response->assertStatus(401);
    }

    public function test_public_endpoint_works_without_authentication()
    {
        // Simulate request to public endpoint without authentication
        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
            'Accept' => 'application/json',
        ])->get('/api/articles/public');

        // Assert request succeeds
        $response->assertStatus(200);
    }
}
