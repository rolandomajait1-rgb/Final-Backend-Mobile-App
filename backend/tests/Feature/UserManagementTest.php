<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Admin Check Access
    // -------------------------------------------------------------------------

    public function test_admin_check_access_returns_true_for_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/check-access')
            ->assertStatus(200)
            ->assertJsonFragment(['has_access' => true, 'role' => 'admin']);
    }

    public function test_admin_check_access_requires_auth(): void
    {
        $this->getJson('/api/admin/check-access')->assertStatus(401);
    }

    public function test_regular_user_cannot_access_admin_check(): void
    {
        $user  = User::factory()->create(['role' => 'user']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/check-access')->assertStatus(403);
    }

    // -------------------------------------------------------------------------
    // Moderator Management
    // -------------------------------------------------------------------------

    public function test_admin_can_list_moderators(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;
        User::factory()->count(2)->create(['role' => 'moderator']);

        $response = $this->withToken($token)->getJson('/api/admin/moderators');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json());
    }

    public function test_non_admin_cannot_list_moderators(): void
    {
        $user  = User::factory()->create(['role' => 'user']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/moderators')->assertStatus(403);
    }

    public function test_admin_can_promote_existing_user_to_moderator(): void
    {
        $admin  = User::factory()->create(['role' => 'admin']);
        $token  = $admin->createToken('test')->plainTextToken;
        $target = User::factory()->create(['role' => 'user', 'email' => 'target@example.com']);

        $this->withToken($token)->postJson('/api/admin/moderators', [
            'email' => 'target@example.com',
        ])->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => $target->id, 'role' => 'moderator']);
    }

    public function test_admin_cannot_promote_already_moderator(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;
        User::factory()->create(['role' => 'moderator', 'email' => 'mod@example.com']);

        $this->withToken($token)->postJson('/api/admin/moderators', [
            'email' => 'mod@example.com',
        ])->assertStatus(400);
    }

    public function test_admin_can_remove_moderator(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;
        $mod   = User::factory()->create(['role' => 'moderator']);

        $this->withToken($token)->deleteJson("/api/admin/moderators/{$mod->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => $mod->id, 'role' => 'user']);
    }

    public function test_remove_moderator_fails_if_user_is_not_moderator(): void
    {
        $admin  = User::factory()->create(['role' => 'admin']);
        $token  = $admin->createToken('test')->plainTextToken;
        $target = User::factory()->create(['role' => 'user']);

        $this->withToken($token)->deleteJson("/api/admin/moderators/{$target->id}")
            ->assertStatus(400);
    }

    public function test_remove_nonexistent_moderator_returns_404(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->deleteJson('/api/admin/moderators/99999')
            ->assertStatus(404);
    }

    public function test_add_moderator_requires_email(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/admin/moderators', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('email');
    }

    // -------------------------------------------------------------------------
    // Role Isolation
    // -------------------------------------------------------------------------

    public function test_moderator_cannot_access_admin_only_routes(): void
    {
        $mod   = User::factory()->create(['role' => 'moderator']);
        $token = $mod->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/check-access')->assertStatus(403);
        $this->withToken($token)->getJson('/api/admin/moderators')->assertStatus(403);
    }

    public function test_author_cannot_access_admin_routes(): void
    {
        $author = User::factory()->create(['role' => 'author']);
        $token  = $author->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/check-access')->assertStatus(403);
    }
}
