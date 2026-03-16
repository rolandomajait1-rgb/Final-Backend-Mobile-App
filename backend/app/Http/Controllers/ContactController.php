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
            'email' => 'required|email',
        ]);

        Mail::raw(
            "New Feedback Received\n\nFrom: {$request->email}\n\nFeedback:\n{$request->feedback}",
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
            'date' => 'required|date',
            'description' => 'required|string',
            'contactEmail' => 'required|email',
        ]);

        Mail::raw(
            "New Coverage Request\n\nEvent: {$request->eventName}\nDate: {$request->date}\nContact: {$request->contactEmail}\n\nDescription:\n{$request->description}",
            function ($message) {
                $message->to(config('mail.from.address', 'admin@laverdadherald.com'))
                    ->subject('Coverage Request - La Verdad Herald');
            }
        );

        return response()->json(['message' => 'Coverage request received successfully']);
    }

    public function joinHerald(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string',
            'course' => 'required|string',
            'gender' => 'required|string',
            'pubName' => 'required|string',
            'specificPosition' => 'required|string',
        ]);

        $classifications = json_encode($request->classifications ?? []);
        $pubOption = json_encode($request->pubOption ?? []);
        $designations = json_encode($request->designations ?? []);

        $emailBody = "New Membership Application\n\n";
        $emailBody .= "Personal Information:\n";
        $emailBody .= "Name: {$request->name}\n";
        $emailBody .= "Course & Year: {$request->course}\n";
        $emailBody .= "Gender: {$request->gender}\n\n";
        $emailBody .= "Publication Information:\n";
        $emailBody .= "Publication Name: {$request->pubName}\n";
        $emailBody .= "Classifications: {$classifications}\n";
        $emailBody .= "Publishing Option: {$pubOption}\n";
        $emailBody .= "Designations: {$designations}\n";
        $emailBody .= "Specific Position: {$request->specificPosition}\n";

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
