<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    public function test_register_succeeds_with_valid_school_email(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Juan Dela Cruz',
            'email'                 => 'juan@student.laverdad.edu.ph',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Registration successful! Please check your email to verify your account before logging in.']);

        $this->assertDatabaseHas('users', ['email' => 'juan@student.laverdad.edu.ph']);
    }

    public function test_register_rejects_non_school_email(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Juan Dela Cruz',
            'email'                 => 'juan@gmail.com',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrorFor('email');
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@student.laverdad.edu.ph']);

        $response = $this->postJson('/api/register', [
            'name'                  => 'Another',
            'email'                 => 'taken@student.laverdad.edu.ph',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrorFor('email');
    }

    public function test_register_rejects_weak_password_no_uppercase(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Juan',
            'email'                 => 'juan@student.laverdad.edu.ph',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrorFor('password');
    }

    public function test_register_rejects_weak_password_no_number(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Juan',
            'email'                 => 'juan@student.laverdad.edu.ph',
            'password'              => 'PasswordOnly',
            'password_confirmation' => 'PasswordOnly',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrorFor('password');
    }

    public function test_register_rejects_password_mismatch(): void
    {
        $response = $this->postJson('/api/register', [
            'name'                  => 'Juan',
            'email'                 => 'juan@student.laverdad.edu.ph',
            'password'              => 'Password123!',
            'password_confirmation' => 'Different123!',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrorFor('password');
    }

    public function test_register_rejects_missing_required_fields(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrorFor('name')
            ->assertJsonValidationErrorFor('email')
            ->assertJsonValidationErrorFor('password');
    }

    public function test_new_user_is_assigned_user_role(): void
    {
        $this->postJson('/api/register', [
            'name'                  => 'Juan',
            'email'                 => 'juan@student.laverdad.edu.ph',
            'password'              => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'juan@student.laverdad.edu.ph',
            'role'  => 'user',
        ]);
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    public function test_verified_user_can_login_and_receives_token(): void
    {
        $user = User::factory()->create([
            'email'    => 'verified@student.laverdad.edu.ph',
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'verified@student.laverdad.edu.ph',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'role', 'user'])
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_login_returns_role_in_response(): void
    {
        User::factory()->create([
            'email'    => 'admin@student.laverdad.edu.ph',
            'password' => bcrypt('Password123!'),
            'role'     => 'admin',
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'admin@student.laverdad.edu.ph',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)->assertJsonPath('role', 'admin');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'user@student.laverdad.edu.ph']);

        $response = $this->postJson('/api/login', [
            'email'    => 'user@student.laverdad.edu.ph',
            'password' => 'WrongPassword1!',
        ]);

        $response->assertStatus(401)->assertJsonFragment(['message' => 'Invalid credentials']);
    }

    public function test_login_fails_for_nonexistent_user(): void
    {
        $response = $this->postJson('/api/login', [
            'email'    => 'ghost@student.laverdad.edu.ph',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(401)->assertJsonFragment(['message' => 'Invalid credentials']);
    }

    public function test_login_blocked_for_unverified_user(): void
    {
        User::factory()->unverified()->create([
            'email'    => 'unverified@student.laverdad.edu.ph',
            'password' => bcrypt('Password123!'),
        ]);

        $response = $this->postJson('/api/login', [
            'email'    => 'unverified@student.laverdad.edu.ph',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment(['requires_verification' => true]);
    }

    public function test_login_does_not_expose_user_existence_on_wrong_password(): void
    {
        $nonExistentResponse = $this->postJson('/api/login', [
            'email'    => 'nobody@student.laverdad.edu.ph',
            'password' => 'Password123!',
        ]);

        User::factory()->create([
            'email'    => 'somebody@student.laverdad.edu.ph',
            'password' => bcrypt('Password123!'),
        ]);

        $wrongPassResponse = $this->postJson('/api/login', [
            'email'    => 'somebody@student.laverdad.edu.ph',
            'password' => 'WrongPassword1!',
        ]);

        $nonExistentResponse->assertStatus(401);
        $wrongPassResponse->assertStatus(401);
        $this->assertEquals(
            $nonExistentResponse->json('message'),
            $wrongPassResponse->json('message')
        );
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------

    public function test_authenticated_user_can_logout(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/logout');

        $response->assertStatus(200)->assertJsonFragment(['message' => 'Logged out successfully']);
    }

    public function test_logout_invalidates_only_current_token(): void
    {
        $user   = User::factory()->create();
        $token1 = $user->createToken('device-1')->plainTextToken;
        $token2 = $user->createToken('device-2')->plainTextToken;

        $this->withToken($token1)->postJson('/api/logout')->assertStatus(200);

        // token2 should still work
        $this->withToken($token2)->getJson('/api/user')->assertStatus(200);
    }

    public function test_unauthenticated_logout_returns_401(): void
    {
        $this->postJson('/api/logout')->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // Change Password
    // -------------------------------------------------------------------------

    public function test_user_can_change_password_with_correct_current_password(): void
    {
        $user  = User::factory()->create(['password' => bcrypt('OldPass123!')]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/change-password', [
            'current_password'      => 'OldPass123!',
            'password'              => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('NewPass456!', $user->fresh()->password));
    }

    public function test_change_password_fails_with_wrong_current_password(): void
    {
        $user  = User::factory()->create(['password' => bcrypt('OldPass123!')]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/change-password', [
            'current_password'      => 'WrongPass123!',
            'password'              => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ]);

        $response->assertStatus(400);
    }

    public function test_change_password_requires_auth(): void
    {
        $this->postJson('/api/change-password', [
            'current_password'      => 'OldPass123!',
            'password'              => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ])->assertStatus(401);
    }

    // -------------------------------------------------------------------------
    // Delete Account
    // -------------------------------------------------------------------------

    public function test_user_can_delete_own_account_with_correct_password(): void
    {
        $user  = User::factory()->create(['password' => bcrypt('Password123!')]);
        $token = $user->createToken('test')->plainTextToken;
        $id    = $user->id;

        $response = $this->withToken($token)->postJson('/api/delete-account', [
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $id]);
    }

    public function test_delete_account_fails_with_wrong_password(): void
    {
        $user  = User::factory()->create(['password' => bcrypt('Password123!')]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/delete-account', [
            'password' => 'WrongPassword1!',
        ]);

        $response->assertStatus(400);
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    // -------------------------------------------------------------------------
    // Protected Route Guard
    // -------------------------------------------------------------------------

    public function test_protected_routes_reject_unauthenticated_requests(): void
    {
        $this->getJson('/api/user')->assertStatus(401);
        $this->getJson('/api/articles')->assertStatus(401);
        $this->getJson('/api/logs')->assertStatus(401);
    }

    public function test_authenticated_user_can_fetch_own_profile(): void
    {
        $user  = User::factory()->create(['name' => 'Test User']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/user')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Test User']);
    }

    public function test_password_not_exposed_in_user_response(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/user');

        $this->assertArrayNotHasKey('password', $response->json());
    }

    // -------------------------------------------------------------------------
    // Forgot / Reset Password
    // -------------------------------------------------------------------------

    public function test_forgot_password_always_returns_200_to_prevent_enumeration(): void
    {
        // Non-existent email
        $this->postJson('/api/forgot-password', ['email' => 'nobody@student.laverdad.edu.ph'])
            ->assertStatus(200);

        // Existing email
        User::factory()->create(['email' => 'real@student.laverdad.edu.ph']);
        $this->postJson('/api/forgot-password', ['email' => 'real@student.laverdad.edu.ph'])
            ->assertStatus(200);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        User::factory()->create(['email' => 'user@student.laverdad.edu.ph']);

        $response = $this->postJson('/api/reset-password', [
            'email'                 => 'user@student.laverdad.edu.ph',
            'token'                 => 'invalid-token-xyz',
            'password'              => 'NewPass456!',
            'password_confirmation' => 'NewPass456!',
        ]);

        $response->assertStatus(400);
    }

    public function test_reset_password_validates_required_fields(): void
    {
        $this->postJson('/api/reset-password', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('email')
            ->assertJsonValidationErrorFor('token')
            ->assertJsonValidationErrorFor('password');
    }

    // -------------------------------------------------------------------------
    // Email Verification
    // -------------------------------------------------------------------------

    public function test_resend_verification_always_returns_200_to_prevent_enumeration(): void
    {
        $this->postJson('/api/email/resend-verification', ['email' => 'ghost@student.laverdad.edu.ph'])
            ->assertStatus(200);
    }

    public function test_verify_email_with_invalid_token_redirects_with_error(): void
    {
        $response = $this->get('/api/email/verify-token?token=bogus-token');

        $response->assertRedirect();
        $this->assertStringContainsString('error=', $response->headers->get('Location'));
    }
}
