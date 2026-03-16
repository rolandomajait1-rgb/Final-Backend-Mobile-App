<?php

namespace App\Services;

use App\Models\Subscriber;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubscriberService
{
    /**
     * Subscribe a new email address
     */
    public function subscribe(string $email, ?string $name = null): array
    {
        // Check if already subscribed
        $existing = Subscriber::where('email', $email)->first();

        if ($existing) {
            if ($existing->status === 'unsubscribed') {
                // Reactivate subscription
                $existing->update([
                    'status' => 'active',
                    'subscribed_at' => now(),
                    'unsubscribed_at' => null,
                ]);

                try {
                    $this->sendWelcomeEmail($existing);
                } catch (\Exception $e) {
                    Log::error('Welcome email failed for reactivated subscriber', [
                        'email' => $email,
                        'error' => $e->getMessage(),
                    ]);
                }

                return [
                    'success' => true,
                    'message' => 'Subscription reactivated successfully! Check your email for confirmation.',
                    'subscriber' => $existing,
                ];
            }

            return [
                'success' => false,
                'message' => 'Email is already subscribed.',
                'subscriber' => $existing,
            ];
        }

        // Create new subscriber
        $subscriber = Subscriber::create([
            'email' => $email,
            'name' => $name,
            'status' => 'active',
        ]);

        // Send welcome email
        try {
            $this->sendWelcomeEmail($subscriber);
        } catch (\Exception $e) {
            Log::error('Welcome email failed for new subscriber', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            // Don't fail subscription if email fails
        }

        return [
            'success' => true,
            'message' => 'Subscription successful! Check your email for confirmation.',
            'subscriber' => $subscriber,
        ];
    }

    /**
     * Unsubscribe using token
     */
    public function unsubscribe(string $token): array
    {
        $subscriber = Subscriber::where('unsubscribe_token', $token)->first();

        if (! $subscriber) {
            return [
                'success' => false,
                'message' => 'Invalid unsubscribe token.',
            ];
        }

        if ($subscriber->status === 'unsubscribed') {
            return [
                'success' => true,
                'message' => 'Already unsubscribed.',
            ];
        }

        $subscriber->unsubscribe();

        Log::info('Subscriber unsubscribed', [
            'email' => $subscriber->email,
        ]);

        return [
            'success' => true,
            'message' => 'Successfully unsubscribed from newsletter.',
        ];
    }

    /**
     * Send welcome email to new subscriber
     */
    private function sendWelcomeEmail(Subscriber $subscriber): void
    {
        $unsubscribeUrl = config('app.frontend_url').'/unsubscribe?token='.$subscriber->unsubscribe_token;

        Mail::send('emails.subscriber-welcome', [
            'subscriber' => $subscriber,
            'unsubscribeUrl' => $unsubscribeUrl,
        ], function ($message) use ($subscriber) {
            $message->to($subscriber->email)
                ->subject('Welcome to La Verdad Herald Newsletter!');
        });

        Log::info('Welcome email sent to subscriber', [
            'email' => $subscriber->email,
        ]);
    }

    /**
     * Send newsletter to all active subscribers
     */
    public function sendNewsletter(string $subject, string $content): array
    {
        $subscribers = Subscriber::active()->get();
        $sent = 0;
        $failed = 0;

        foreach ($subscribers as $subscriber) {
            try {
                $unsubscribeUrl = config('app.frontend_url').'/unsubscribe?token='.$subscriber->unsubscribe_token;

                Mail::send('emails.newsletter', [
                    'subscriber' => $subscriber,
                    'content' => $content,
                    'unsubscribeUrl' => $unsubscribeUrl,
                ], function ($message) use ($subscriber, $subject) {
                    $message->to($subscriber->email)
                        ->subject($subject);
                });

                $sent++;

                Log::info('Newsletter sent to subscriber', [
                    'email' => $subscriber->email,
                    'subject' => $subject,
                ]);

            } catch (\Exception $e) {
                Log::error('Newsletter send failed', [
                    'email' => $subscriber->email,
                    'error' => $e->getMessage(),
                ]);
                $failed++;
            }
        }

        return [
            'total' => $subscribers->count(),
            'sent' => $sent,
            'failed' => $failed,
        ];
    }

    /**
     * Get subscriber statistics
     */
    public function getStatistics(): array
    {
        return [
            'total' => Subscriber::count(),
            'active' => Subscriber::where('status', 'active')->count(),
            'inactive' => Subscriber::where('status', 'inactive')->count(),
            'unsubscribed' => Subscriber::where('status', 'unsubscribed')->count(),
        ];
    }
}
