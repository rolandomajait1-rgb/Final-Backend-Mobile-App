<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactAndTagTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Contact — Feedback
    // -------------------------------------------------------------------------

    public function test_feedback_form_sends_successfully(): void
    {
        Mail::fake();

        $this->postJson('/api/contact/feedback', [
            'email'    => 'student@student.laverdad.edu.ph',
            'feedback' => 'Great newspaper!',
        ])->assertStatus(200)->assertJsonFragment(['message' => 'Feedback received successfully']);
    }

    public function test_feedback_requires_email_and_feedback(): void
    {
        $this->postJson('/api/contact/feedback', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('email')
            ->assertJsonValidationErrorFor('feedback');
    }

    public function test_feedback_rejects_invalid_email(): void
    {
        $this->postJson('/api/contact/feedback', [
            'email'    => 'not-an-email',
            'feedback' => 'Hello',
        ])->assertStatus(422)->assertJsonValidationErrorFor('email');
    }

    // -------------------------------------------------------------------------
    // Contact — Coverage Request
    // -------------------------------------------------------------------------

    public function test_coverage_request_sends_successfully(): void
    {
        Mail::fake();

        $this->postJson('/api/contact/request-coverage', [
            'eventName'    => 'Graduation Ceremony',
            'date'         => now()->addDays(10)->toDateString(),
            'description'  => 'Annual graduation event.',
            'contactEmail' => 'organizer@student.laverdad.edu.ph',
        ])->assertStatus(200)->assertJsonFragment(['message' => 'Coverage request received successfully']);
    }

    public function test_coverage_request_requires_all_fields(): void
    {
        $this->postJson('/api/contact/request-coverage', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('eventName')
            ->assertJsonValidationErrorFor('date')
            ->assertJsonValidationErrorFor('description')
            ->assertJsonValidationErrorFor('contactEmail');
    }

    public function test_coverage_request_rejects_invalid_date(): void
    {
        $this->postJson('/api/contact/request-coverage', [
            'eventName'    => 'Event',
            'date'         => 'not-a-date',
            'description'  => 'Desc',
            'contactEmail' => 'a@student.laverdad.edu.ph',
        ])->assertStatus(422)->assertJsonValidationErrorFor('date');
    }

    // -------------------------------------------------------------------------
    // Contact — Join Herald
    // -------------------------------------------------------------------------

    public function test_join_herald_sends_successfully(): void
    {
        Mail::fake();

        $this->postJson('/api/contact/join-herald', [
            'name'             => 'Maria Santos',
            'course'           => 'BS Journalism 3A',
            'gender'           => 'Female',
            'pubName'          => 'La Verdad Herald',
            'specificPosition' => 'Writer',
        ])->assertStatus(200)->assertJsonFragment(['message' => 'Application submitted successfully']);
    }

    public function test_join_herald_requires_mandatory_fields(): void
    {
        $this->postJson('/api/contact/join-herald', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('name')
            ->assertJsonValidationErrorFor('course')
            ->assertJsonValidationErrorFor('gender')
            ->assertJsonValidationErrorFor('pubName')
            ->assertJsonValidationErrorFor('specificPosition');
    }

    // -------------------------------------------------------------------------
    // Subscribe
    // -------------------------------------------------------------------------

    public function test_subscribe_with_valid_email_succeeds(): void
    {
        $this->postJson('/api/contact/subscribe', [
            'email' => 'reader@example.com',
        ])->assertStatus(200);
    }

    public function test_subscribe_rejects_invalid_email(): void
    {
        $this->postJson('/api/contact/subscribe', [
            'email' => 'not-valid',
        ])->assertStatus(422)->assertJsonValidationErrorFor('email');
    }

    public function test_subscribe_requires_email(): void
    {
        $this->postJson('/api/contact/subscribe', [])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('email');
    }

    // -------------------------------------------------------------------------
    // Tags — Public
    // -------------------------------------------------------------------------

    public function test_public_tags_endpoint_returns_list(): void
    {
        Tag::factory()->count(3)->create();

        $this->getJson('/api/tags')
            ->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_public_tag_show_returns_tag(): void
    {
        $tag = Tag::factory()->create(['slug' => 'campus-news']);

        $this->getJson("/api/tags/{$tag->id}")
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $tag->id]);
    }

    // -------------------------------------------------------------------------
    // Tags — RBAC
    // -------------------------------------------------------------------------

    public function test_unauthenticated_user_cannot_create_tag(): void
    {
        $this->postJson('/api/tags', ['name' => 'Breaking'])->assertStatus(401);
    }

    public function test_regular_user_cannot_create_tag(): void
    {
        $user  = User::factory()->create(['role' => 'user']);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/tags', ['name' => 'Breaking'])
            ->assertStatus(403);
    }

    public function test_admin_can_create_tag(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/tags', ['name' => 'Breaking News'])
            ->assertStatus(201)
            ->assertJsonFragment(['name' => 'Breaking News']);
    }

    public function test_admin_can_delete_tag(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;
        $tag   = Tag::factory()->create();

        $this->withToken($token)->deleteJson("/api/tags/{$tag->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
    }

    public function test_create_tag_rejects_duplicate_name(): void
    {
        Tag::factory()->create(['name' => 'Sports']);
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/tags', ['name' => 'Sports'])
            ->assertStatus(422)
            ->assertJsonValidationErrorFor('name');
    }
}
