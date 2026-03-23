<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function sendFeedback(Request $request): JsonResponse
    {
        $request->validate([
            'feedback' => 'required|string',
        ]);

        Mail::raw(
            "New Feedback Received\n\nFeedback:\n{$request->feedback}",
            function ($message) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                    ->subject('New Feedback - La Verdad Herald');
            }
        );

        return response()->json(['message' => 'Feedback received successfully']);
    }

    public function requestCoverage(Request $request): JsonResponse
    {
        $request->validate([
            'eventName' => 'required|string',
            'purpose' => 'required|string',
            'location' => 'required|string',
            'dateTime' => 'required|string',
            'highlights' => 'required|string',
            'requesterName' => 'required|string',
            'designation' => 'required|string',
            'coordinator' => 'required|string',
        ]);

        $emailBody = "New Coverage Request\n\n";
        $emailBody .= "Event Name: {$request->eventName}\n";
        $emailBody .= "Purpose/Significance: {$request->purpose}\n";
        $emailBody .= "Location: {$request->location}\n";
        $emailBody .= "Date and Time: {$request->dateTime}\n";
        $emailBody .= "Event Highlights: {$request->highlights}\n";
        $emailBody .= "Requestor Name: {$request->requesterName}\n";
        $emailBody .= "Designation: {$request->designation}\n";
        $emailBody .= "Organizer/Office Coordinator: {$request->coordinator}\n";

        Mail::raw($emailBody, function ($message) {
            $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                ->subject('Coverage Request - La Verdad Herald');
        });

        return response()->json(['message' => 'Coverage request received successfully']);
    }

    public function joinHerald(Request $request): JsonResponse
    {
        $request->validate([
            'fullName' => 'required|string',
            'courseYear' => 'required|string',
            'gender' => 'required|string|in:Male,Female',
        ]);

        $emailBody = "New Membership Application\n\n";
        $emailBody .= "Personal Information:\n";
        $emailBody .= "Full Name: {$request->fullName}\n";
        $emailBody .= "Course & Year: {$request->courseYear}\n";
        $emailBody .= "Gender: {$request->gender}\n";

        Mail::raw($emailBody, function ($message) {
            $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                ->subject('Membership Application - La Verdad Herald');
        });

        return response()->json(['message' => 'Application submitted successfully']);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string|max:255',
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
