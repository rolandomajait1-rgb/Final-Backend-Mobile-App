<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class SubscriberController extends Controller
{
    public function index(): JsonResponse|View
    {
        $subscribers = Subscriber::paginate(10);

        // Return JSON for API requests
        if (request()->wantsJson() || request()->is('api/*')) {
            return response()->json([
                'data' => $subscribers->items(),
                'meta' => [
                    'current_page' => $subscribers->currentPage(),
                    'per_page' => $subscribers->perPage(),
                    'total' => $subscribers->total(),
                    'last_page' => $subscribers->lastPage(),
                ],
            ]);
        }

        return view('subscribers.index', compact('subscribers'));
    }

    public function create(): View
    {
        return view('subscribers.create');
    }

    public function store(Request $request): Response
    {
        $request->validate([
            'email' => 'required|email|unique:subscribers',
            'name' => 'nullable|string|max:255',
        ]);

        $data = $request->all();
        $data['status'] = 'active';
        $data['subscribed_at'] = now();

        $subscriber = Subscriber::create($data);

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'created',
            'model_type' => 'Subscriber',
            'model_id' => $subscriber->id,
            'new_values' => $subscriber->toArray(),
        ]);

        return redirect()->route('subscribers.index')->with('success', 'Subscriber created successfully.');
    }

    public function show(Subscriber $subscriber): View
    {
        return view('subscribers.show', compact('subscriber'));
    }

    public function edit(Subscriber $subscriber): View
    {
        return view('subscribers.edit', compact('subscriber'));
    }

    public function update(Request $request, Subscriber $subscriber): Response
    {
        $request->validate([
            'email' => 'required|email|unique:subscribers,email,'.$subscriber->id,
            'name' => 'nullable|string|max:255',
            'status' => 'in:active,inactive,unsubscribed',
        ]);

        $oldValues = $subscriber->toArray();

        $subscriber->update($request->all());

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'updated',
            'model_type' => 'Subscriber',
            'model_id' => $subscriber->id,
            'old_values' => $oldValues,
            'new_values' => $subscriber->toArray(),
        ]);

        return redirect()->route('subscribers.index')->with('success', 'Subscriber updated successfully.');
    }

    public function destroy(Subscriber $subscriber): Response
    {
        $oldValues = $subscriber->toArray();

        $subscriber->delete();

        Log::create([
            'user_id' => Auth::id(),
            'action' => 'deleted',
            'model_type' => 'Subscriber',
            'model_id' => $subscriber->id,
            'old_values' => $oldValues,
        ]);

        return redirect()->route('subscribers.index')->with('success', 'Subscriber deleted successfully.');
    }

    // Public-facing: subscribe via homepage/footer
    public function publicStore(Request $request): Response
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

        if ($result['success']) {
            return back()->with('success', $result['message']);
        }

        return back()->withErrors(['email' => $result['message']]);
    }

    // Public unsubscribe endpoint
    public function unsubscribe(Request $request): Response
    {
        $token = $request->query('token');

        if (! $token) {
            return redirect(config('app.frontend_url').'/?error=invalid_token');
        }

        $subscriberService = app(\App\Services\SubscriberService::class);
        $result = $subscriberService->unsubscribe($token);

        if ($result['success']) {
            return redirect(config('app.frontend_url').'/?unsubscribed=1');
        }

        return redirect(config('app.frontend_url').'/?error=invalid_token');
    }

    // Admin: Send newsletter to all subscribers
    public function sendNewsletter(Request $request): JsonResponse
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $subscriberService = app(\App\Services\SubscriberService::class);
        $result = $subscriberService->sendNewsletter(
            $request->subject,
            $request->content
        );

        return response()->json([
            'message' => "Newsletter sent to {$result['sent']} subscribers",
            'statistics' => $result,
        ]);
    }
}
