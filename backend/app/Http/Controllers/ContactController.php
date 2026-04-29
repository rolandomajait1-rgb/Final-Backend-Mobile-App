<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\CloudinaryService;

class ContactController extends Controller
{
    // ─── Shared: Send via Brevo HTTP API (same method OTP uses) ────────────────
    private function sendBrevoEmail(string $toEmail, string $toName, string $subject, string $htmlContent, ?string $replyTo = null): void
    {
        $apiKey    = (string) config('services.brevo.key');
        $fromEmail = (string) config('mail.from.address', 'rolandomajait1@gmail.com');
        $fromName  = (string) config('mail.from.name', 'Official La Verdad Herald');

        $payload = [
            'sender'      => ['email' => $fromEmail, 'name' => $fromName],
            'to'          => [['email' => $toEmail, 'name' => $toName]],
            'subject'     => $subject,
            'htmlContent' => $htmlContent,
        ];

        if ($replyTo) {
            $payload['replyTo'] = ['email' => $replyTo];
        }

        $response = Http::withHeaders([
            'accept'  => 'application/json',
            'api-key' => $apiKey,
        ])->post('https://api.brevo.com/v3/smtp/email', $payload);

        if (! $response->successful()) {
            throw new \RuntimeException('Brevo API error: ' . $response->body());
        }
    }

    // ─── Helper: wrap plain text in simple HTML ─────────────────────────────────
    private function toHtml(string $text): string
    {
        $escaped = htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $lines   = nl2br($escaped);

        return <<<HTML
        <html><body style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1a2e;border-bottom:2px solid #e63946;padding-bottom:8px;">La Verdad Herald</h2>
        <div style="margin-top:16px;">{$lines}</div>
        </div></body></html>
        HTML;
    }

    // ─── Send Feedback ──────────────────────────────────────────────────────────
    public function sendFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'feedback' => 'required|string|max:5000',
            'email'    => 'nullable|email',
        ]);

        $from = $request->email ?? 'anonymous@app';
        $body = "New Feedback Received\n\nFrom: {$from}\n\nFeedback:\n{$request->feedback}";

        \App\Models\ContactSubmission::create([
            'type'    => 'feedback',
            'payload' => $request->all(),
        ]);

        $adminEmail = (string) config('mail.from.address', 'rolandomajait1@gmail.com');

        try {
            $this->sendBrevoEmail(
                $adminEmail,
                'La Verdad Herald Admin',
                'New Feedback - La Verdad Herald',
                $this->toHtml($body),
                $from !== 'anonymous@app' ? $from : null
            );
            Log::info('Feedback email sent successfully (Brevo API)', ['from' => $from]);
        } catch (\Exception $e) {
            Log::error('Brevo API failed (feedback): ' . $e->getMessage(), ['from' => $from]);
            // Don't fail the request — submission is already saved
        }

        return response()->json(['message' => 'Feedback received successfully']);
    }

    // ─── Request Coverage ───────────────────────────────────────────────────────
    public function requestCoverage(Request $request): JsonResponse
    {
        $request->validate([
            'eventName'     => 'required|string|max:255',
            'purpose'       => 'nullable|string',
            'location'      => 'nullable|string',
            'dateTime'      => 'nullable|string',
            'highlights'    => 'nullable|string',
            'requesterName' => 'nullable|string',
            'designation'   => 'nullable|string',
            'coordinator'   => 'nullable|string',
            // Legacy web fields
            'date'          => 'nullable|string',
            'description'   => 'nullable|string',
            'contactEmail'  => 'nullable|email',
        ]);

        $body  = "New Coverage Request\n\n";
        $body .= "Event: {$request->eventName}\n";
        $body .= "Purpose / Significance: " . ($request->purpose ?? $request->description ?? 'N/A') . "\n";
        $body .= "Location: " . ($request->location ?? 'N/A') . "\n";
        $body .= "Date & Time: " . ($request->dateTime ?? $request->date ?? 'N/A') . "\n";
        $body .= "Event Highlights: " . ($request->highlights ?? 'N/A') . "\n\n";
        $body .= "Requester Information:\n";
        $body .= "Full Name: " . ($request->requesterName ?? 'N/A') . "\n";
        $body .= "Designation: " . ($request->designation ?? 'N/A') . "\n";
        $body .= "Organizer / Coordinator: " . ($request->coordinator ?? 'N/A') . "\n";
        $body .= "Contact Email: " . ($request->contactEmail ?? 'N/A') . "\n";

        \App\Models\ContactSubmission::create([
            'type'    => 'coverage',
            'payload' => $request->all(),
        ]);

        $adminEmail = (string) config('mail.from.address', 'rolandomajait1@gmail.com');

        try {
            $this->sendBrevoEmail(
                $adminEmail,
                'La Verdad Herald Admin',
                'Coverage Request - La Verdad Herald',
                $this->toHtml($body),
                $request->contactEmail ?: null
            );
            Log::info('Coverage request email sent successfully (Brevo API)', [
                'event' => $request->eventName,
                'email' => $request->contactEmail,
            ]);
        } catch (\Exception $e) {
            Log::error('Brevo API failed (coverage): ' . $e->getMessage(), [
                'event' => $request->eventName,
            ]);
        }

        return response()->json(['message' => 'Coverage request received successfully']);
    }

    // ─── Join Herald ────────────────────────────────────────────────────────────
    public function joinHerald(Request $request): JsonResponse
    {
        $request->validate([
            'fullName'    => 'nullable|string|max:255',
            'courseYear'  => 'nullable|string|max:255',
            'gender'      => 'nullable|string|max:50',
            'email'       => 'nullable|email',
            'photo'       => 'nullable|file|mimes:jpg,jpeg,png,gif|max:5120',
            'consentForm' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'name'        => 'nullable|string|max:255',
            'course'      => 'nullable|string|max:255',
        ]);

        // Check daily upload limit per IP
        $uploadedToday = \App\Models\ContactSubmission::where('type', 'join_herald')
            ->where('created_at', '>=', now()->startOfDay())
            ->whereJsonContains('payload->ip', $request->ip())
            ->count();

        if ($uploadedToday >= 3) {
            return response()->json(['message' => 'Daily upload limit reached. Please try again tomorrow.'], 429);
        }

        $name   = $request->fullName   ?? $request->name   ?? 'N/A';
        $course = $request->courseYear ?? $request->course  ?? 'N/A';
        $gender = $request->gender ?? 'N/A';

        $photoUrl   = null;
        $consentUrl = null;

        // Upload photo to Cloudinary (persistent, survives server restarts)
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $imageInfo = getimagesize($file->getRealPath());
            if (! $imageInfo) {
                return response()->json(['message' => 'Invalid photo file'], 422);
            }
            try {
                $cloudinary = app(CloudinaryService::class);
                $result = $cloudinary->getUploadApi()->upload($file->getRealPath(), [
                    'folder'        => 'herald-applications/photos',
                    'resource_type' => 'image',
                    'quality'       => 'auto:good',
                ]);
                $photoUrl = $result['secure_url'] ?? null;
                Log::info('Photo uploaded to Cloudinary', ['url' => $photoUrl]);
            } catch (\Exception $e) {
                Log::error('Photo upload to Cloudinary failed', ['error' => $e->getMessage()]);
                // Continue even if photo upload fails
            }
        }

        // Upload consent form to Cloudinary
        if ($request->hasFile('consentForm')) {
            $file = $request->file('consentForm');
            try {
                $cloudinary = app(CloudinaryService::class);
                $result = $cloudinary->getUploadApi()->upload($file->getRealPath(), [
                    'folder'        => 'herald-applications/consent',
                    'resource_type' => 'auto',  // handles PDF and images
                ]);
                $consentUrl = $result['secure_url'] ?? null;
                Log::info('Consent form uploaded to Cloudinary', ['url' => $consentUrl]);
            } catch (\Exception $e) {
                Log::error('Consent upload to Cloudinary failed', ['error' => $e->getMessage()]);
                // Continue even if consent upload fails
            }
        }

        $body  = "New Membership Application\n\n";
        $body .= "Personal Information:\n";
        $body .= "Name: {$name}\n";
        $body .= "Course & Year: {$course}\n";
        $body .= "Gender: {$gender}\n";
        $body .= "Email: " . ($request->email ?? 'N/A') . "\n\n";
        $body .= "Attachments (click to view/download):\n";
        $body .= "Photo: "       . ($photoUrl   ? $photoUrl   : 'Not provided') . "\n";
        $body .= "Consent Form: " . ($consentUrl ? $consentUrl : 'Not provided') . "\n";

        if ($request->pubName)          $body .= "Publication Name: {$request->pubName}\n";
        if ($request->specificPosition) $body .= "Specific Position: {$request->specificPosition}\n";
        if ($request->classifications)  $body .= "Classifications: " . json_encode($request->classifications) . "\n";

        \App\Models\ContactSubmission::create([
            'type'    => 'join_herald',
            'payload' => array_merge(
                $request->except(['photo', 'consentForm']),
                ['ip' => $request->ip()]
            ),
        ]);

        $adminEmail = (string) config('mail.from.address', 'rolandomajait1@gmail.com');

        // HTML version for better email display
        $htmlBody = $this->toHtml($body);
        // Add clickable links for attachments
        if ($photoUrl) {
            $htmlBody = str_replace(
                htmlspecialchars($photoUrl),
                '<a href="' . $photoUrl . '" style="color:#e63946;">📷 View Photo</a>',
                $htmlBody
            );
        }
        if ($consentUrl) {
            $htmlBody = str_replace(
                htmlspecialchars($consentUrl),
                '<a href="' . $consentUrl . '" style="color:#e63946;">📄 View Consent Form</a>',
                $htmlBody
            );
        }

        $adminEmail = (string) config('mail.from.address', 'rolandomajait1@gmail.com');

        try {
            $this->sendBrevoEmail(
                $adminEmail,
                'La Verdad Herald Admin',
                'Membership Application - La Verdad Herald',
                $htmlBody,
                $request->email ?: null
            );
            Log::info('Join Herald email sent successfully (Brevo API)', [
                'name'  => $name,
                'email' => $request->email,
            ]);
        } catch (\Exception $e) {
            Log::error('Brevo API failed (join): ' . $e->getMessage(), ['name' => $name]);
        }

        return response()->json(['message' => 'Application submitted successfully']);
    }

    // ─── Debug: Test Email Sending (Live) ──────────────────────────────────────
    public function testEmailLive(): JsonResponse
    {
        $adminEmail = (string) config('mail.from.address', 'rolandomajait1@gmail.com');
        $apiKey     = (string) config('services.brevo.key');
        
        try {
            $this->sendBrevoEmail(
                $adminEmail,
                'Debug Test',
                'LIVE TEST - La Verdad Herald',
                $this->toHtml("This is a live test to see if Brevo API is working.\nAdmin Email: {$adminEmail}\nAPI Key found: " . ($apiKey ? 'Yes' : 'No')),
                null
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully to ' . $adminEmail,
                'config'  => [
                    'admin_email' => $adminEmail,
                    'api_key_set' => !empty($apiKey),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email failed: ' . $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ], 500);
        }
    }

    // ─── Subscribe ──────────────────────────────────────────────────────────────
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'name'  => 'nullable|string|max:255',
        ]);

        $subscriberService = app(\App\Services\SubscriberService::class);
        $result = $subscriberService->subscribe(
            $request->email,
            $request->name
        );

        return response()->json([
            'message' => $result['message'],
        ], $result['success'] ? 200 : 400);
    }
}
