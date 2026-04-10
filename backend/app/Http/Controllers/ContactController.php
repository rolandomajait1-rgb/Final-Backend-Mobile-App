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

        try {
            Mail::raw($body, function ($message) use ($from) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                        ->replyTo($from)
                        ->subject('New Feedback - La Verdad Herald');
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Mail send failed (feedback): ' . $e->getMessage());
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

        try {
            Mail::raw($body, function ($message) use ($request) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                        ->subject('Coverage Request - La Verdad Herald');
                
                if ($request->contactEmail) {
                    $message->replyTo($request->contactEmail);
                }
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Mail send failed (coverage): ' . $e->getMessage());
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

        $name   = $request->fullName   ?? $request->name   ?? 'N/A';
        $course = $request->courseYear ?? $request->course  ?? 'N/A';
        $gender = $request->gender ?? 'N/A';

        // Store uploaded files if present
        $photoPath  = $request->hasFile('photo')       ? $request->file('photo')->store('herald-applications/photos', 'public')       : null;
        $consentPath = $request->hasFile('consentForm') ? $request->file('consentForm')->store('herald-applications/consent', 'public') : null;

        $body  = "New Membership Application\n\n";
        $body .= "Personal Information:\n";
        $body .= "Name: {$name}\n";
        $body .= "Course & Year: {$course}\n";
        $body .= "Gender: {$gender}\n";
        $body .= "Email: " . ($request->email ?? 'N/A') . "\n\n";
        $body .= "Attachments:\n";
        $body .= "Photo: "       . ($photoPath   ? "Uploaded — {$photoPath}" : 'Not provided') . "\n";
        $body .= "Consent Form: " . ($consentPath ? "Uploaded — {$consentPath}" : 'Not provided') . "\n";

        // Optional extra fields from web form
        if ($request->pubName)          $body .= "Publication Name: {$request->pubName}\n";
        if ($request->specificPosition) $body .= "Specific Position: {$request->specificPosition}\n";
        if ($request->classifications)  $body .= "Classifications: " . json_encode($request->classifications) . "\n";

        try {
            Mail::raw($body, function ($message) use ($request) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                        ->subject('Membership Application - La Verdad Herald');

                if ($request->email) {
                    $message->replyTo($request->email);
                }
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Mail send failed (join): ' . $e->getMessage());
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
