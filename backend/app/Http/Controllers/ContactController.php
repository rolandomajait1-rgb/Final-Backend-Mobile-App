<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    // ─── Send Feedback ─────────────────────────────────────────────────────────
    public function sendFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'feedback' => 'required|string|max:5000',
            'email'    => 'nullable|email',       // optional — mobile doesn't collect it
        ]);

        $from  = $request->email ?? 'anonymous@app';
        $body  = "New Feedback Received\n\nFrom: {$from}\n\nFeedback:\n{$request->feedback}";

        \App\Models\ContactSubmission::create([
            'type' => 'feedback',
            'payload' => $request->all(),
        ]);

        // Send email notification
        try {
            Mail::raw($body, function ($message) use ($from) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                        ->replyTo($from)
                        ->subject('New Feedback - La Verdad Herald');
            });
            
            \Illuminate\Support\Facades\Log::info('Feedback email sent successfully', ['from' => $from]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Mail send failed (feedback): ' . $e->getMessage(), [
                'from' => $from,
                'exception' => $e
            ]);
            // Don't fail the request - submission is already saved
        }

        return response()->json(['message' => 'Feedback received successfully']);
    }

    // ─── Request Coverage ──────────────────────────────────────────────────────
    public function requestCoverage(Request $request): JsonResponse
    {
        $request->validate([
            'eventName'     => 'required|string|max:255',
            'purpose'       => 'nullable|string',      // mobile sends "purpose"
            'location'      => 'nullable|string',
            'dateTime'      => 'nullable|string',      // mobile sends "dateTime" (free text)
            'highlights'    => 'nullable|string',
            'requesterName' => 'nullable|string',
            'designation'   => 'nullable|string',
            'coordinator'   => 'nullable|string',
            // Legacy web fields (kept for backwards compat)
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
            'type' => 'coverage',
            'payload' => $request->all(),
        ]);

        // Send email notification
        try {
            Mail::raw($body, function ($message) use ($request) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                        ->subject('Coverage Request - La Verdad Herald');
                
                if ($request->contactEmail) {
                    $message->replyTo($request->contactEmail);
                }
            });
            
            \Illuminate\Support\Facades\Log::info('Coverage request email sent successfully', [
                'event' => $request->eventName,
                'email' => $request->contactEmail
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Mail send failed (coverage): ' . $e->getMessage(), [
                'event' => $request->eventName,
                'exception' => $e
            ]);
            // Don't fail the request - submission is already saved
        }

        return response()->json(['message' => 'Coverage request received successfully']);
    }

    // ─── Join Herald ───────────────────────────────────────────────────────────
    public function joinHerald(Request $request): JsonResponse
    {
        $request->validate([
            // Mobile field names
            'fullName'    => 'nullable|string|max:255',
            'courseYear'  => 'nullable|string|max:255',
            'gender'      => 'nullable|string|max:50',
            'email'       => 'nullable|email',
            // File attachments from mobile
            'photo'       => 'nullable|file|mimes:jpg,jpeg,png,gif|max:5120',
            'consentForm' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            // Legacy web field names
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

        // Store uploaded files if present with validation
        $photoPath = null;
        $consentPath = null;

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            
            // Validate actual file content
            $imageInfo = getimagesize($file->getRealPath());
            if (!$imageInfo) {
                return response()->json(['message' => 'Invalid photo file'], 422);
            }
            
            // Generate safe filename
            $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
            $photoPath = $file->storeAs('herald-applications/photos', $filename, 'public');
        }

        if ($request->hasFile('consentForm')) {
            $file = $request->file('consentForm');
            
            // Generate safe filename
            $filename = \Illuminate\Support\Str::uuid() . '.' . $file->getClientOriginalExtension();
            $consentPath = $file->storeAs('herald-applications/consent', $filename, 'public');
        }

        $body  = "New Membership Application\n\n";
        $body .= "Personal Information:\n";
        $body .= "Name: {$name}\n";
        $body .= "Course & Year: {$course}\n";
        $body .= "Gender: {$gender}\n";
        $body .= "Email: " . ($request->email ?? 'N/A') . "\n\n";
        $body .= "Attachments:\n";
        $body .= "Photo: "       . ($photoPath   ? "Uploaded — " . asset('storage/' . $photoPath) : 'Not provided') . "\n";
        $body .= "Consent Form: " . ($consentPath ? "Uploaded — " . asset('storage/' . $consentPath) : 'Not provided') . "\n";

        // Optional extra fields from web form
        if ($request->pubName)          $body .= "Publication Name: {$request->pubName}\n";
        if ($request->specificPosition) $body .= "Specific Position: {$request->specificPosition}\n";
        if ($request->classifications)  $body .= "Classifications: " . json_encode($request->classifications) . "\n";

        \App\Models\ContactSubmission::create([
            'type' => 'join_herald',
            'payload' => array_merge(
                $request->except(['photo', 'consentForm']),
                ['ip' => $request->ip()]
            ),
        ]);

        // Send email notification
        try {
            Mail::raw($body, function ($message) use ($request, $photoPath, $consentPath) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                        ->subject('Membership Application - La Verdad Herald');

                if ($request->email) {
                    $message->replyTo($request->email);
                }

                if ($photoPath) {
                    $message->attach(storage_path('app/public/' . $photoPath));
                }
                if ($consentPath) {
                    $message->attach(storage_path('app/public/' . $consentPath));
                }
            });
            
            \Illuminate\Support\Facades\Log::info('Join Herald email sent successfully', [
                'name' => $name,
                'email' => $request->email
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Mail send failed (join): ' . $e->getMessage(), [
                'name' => $name,
                'exception' => $e
            ]);
            // Don't fail the request - submission is already saved
        }

        return response()->json(['message' => 'Application submitted successfully']);
    }

    // ─── Subscribe ─────────────────────────────────────────────────────────────
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
