<?php

namespace App\Services;

use App\Mail\PasswordResetEmail;
use App\Mail\VerificationEmail;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailService
{
    /**
     * Validate configured mail settings before starting auth flows that require email delivery.
     *
     * @throws \RuntimeException
     */
    public function assertMailConfiguration(): void
    {
        $this->validateMailConfiguration($this->transactionalMailer());
    }

    /**
     * Determine which mailer should be used for registration and reset flows.
     */
    private function transactionalMailer(): string
    {
        return (string) config('mail.transactional_mailer', config('mail.default', 'smtp'));
    }

    /**
     * Ensure SMTP mailer has required settings before attempting network calls.
     *
     * @throws \RuntimeException
     */
    private function validateMailConfiguration(string $mailer): void
    {
        if (! array_key_exists($mailer, (array) config('mail.mailers', []))) {
            throw new \RuntimeException("Unsupported transactional mailer configured: {$mailer}");
        }

        if ($mailer === 'smtp') {
            $required = [
                'MAIL_HOST' => config('mail.mailers.smtp.host'),
                'MAIL_PORT' => config('mail.mailers.smtp.port'),
                'MAIL_USERNAME' => config('mail.mailers.smtp.username'),
                'MAIL_PASSWORD' => config('mail.mailers.smtp.password'),
                'MAIL_FROM_ADDRESS' => config('mail.from.address'),
            ];

            $missing = [];
            foreach ($required as $name => $value) {
                if ($value === null || $value === '') {
                    $missing[] = $name;
                }
            }

            if ($missing !== []) {
                throw new \RuntimeException('Mail configuration incomplete: '.implode(', ', $missing));
            }

            $placeholderValues = [
                'MAIL_USERNAME' => [
                    'your_brevo_username',
                    '<your_brevo_username>',
                ],
                'MAIL_PASSWORD' => [
                    'your_brevo_smtp_key_here',
                    '<your_brevo_password>',
                ],
                'MAIL_FROM_ADDRESS' => [
                    'noreply@yourdomain.com',
                    'hello@example.com',
                    'your@email.com',
                ],
            ];

            $placeholderFields = [];
            foreach ($placeholderValues as $name => $placeholders) {
                $value = strtolower(trim((string) ($required[$name] ?? '')));
                if ($value === '') {
                    continue;
                }

                if (in_array($value, $placeholders, true)) {
                    $placeholderFields[] = $name;
                }
            }

            if ($placeholderFields !== []) {
                throw new \RuntimeException('Mail configuration uses placeholder values: '.implode(', ', $placeholderFields));
            }

            return;
        }

        if ($mailer !== 'brevo') {
            return;
        }

        $required = [
            'BREVO_API_KEY' => config('services.brevo.key'),
            'MAIL_FROM_ADDRESS' => config('mail.from.address'),
        ];

        $missing = [];
        foreach ($required as $name => $value) {
            if ($value === null || $value === '') {
                $missing[] = $name;
            }
        }

        if ($missing !== []) {
            throw new \RuntimeException('Mail configuration incomplete: '.implode(', ', $missing));
        }

        $placeholderValues = [
            'BREVO_API_KEY' => [
                'your_brevo_api_key_here',
                '<your_brevo_api_key>',
            ],
            'MAIL_FROM_ADDRESS' => [
                'noreply@yourdomain.com',
                'hello@example.com',
                'your@email.com',
            ],
        ];

        $placeholderFields = [];
        foreach ($placeholderValues as $name => $placeholders) {
            $value = strtolower(trim((string) ($required[$name] ?? '')));
            if ($value === '') {
                continue;
            }

            if (in_array($value, $placeholders, true)) {
                $placeholderFields[] = $name;
            }
        }

        if ($placeholderFields !== []) {
            throw new \RuntimeException('Mail configuration uses placeholder values: '.implode(', ', $placeholderFields));
        }
    }

    /**
     * Send email verification email
     *
     * @throws \Exception
     */
    public function sendVerificationEmail(User $user, string $token): void
    {
        $mailer = $this->transactionalMailer();

        try {
            if ($mailer === 'brevo') {
                $verificationUrl = $this->buildVerificationUrl($token);
                $this->sendBrevoEmail(
                    $user,
                    'Verify Your Email Address',
                    view('emails.verify-email', [
                        'user' => $user,
                        'verificationUrl' => $verificationUrl,
                    ])->render(),
                    ['email_verification']
                );

                $usedMailer = 'brevo_api';
            } else {
                $this->validateMailConfiguration($mailer);
                $verificationUrl = $this->buildVerificationUrl($token);

                Mail::mailer($mailer)->to($user->email)->send(new VerificationEmail($user, $verificationUrl));

                $usedMailer = $mailer;
            }

            Log::info('Verification email sent', [
                'user_email' => $user->email,
                'operation' => 'email_verification',
                'mailer' => $usedMailer,
            ]);
        } catch (\Exception $e) {
            Log::error('Verification email failed', [
                'user_email' => $user->email,
                'operation' => 'email_verification',
                'mailer' => $mailer,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Send password reset email
     *
     * @throws \Exception
     */
    public function sendPasswordResetEmail(User $user, string $token): void
    {
        $mailer = $this->transactionalMailer();

        try {
            $resetUrl = $this->buildPasswordResetUrl($token, $user->email);

            if ($mailer === 'brevo') {
                $this->sendBrevoEmail(
                    $user,
                    'Reset Your Password',
                    view('emails.reset-password', [
                        'user' => $user,
                        'resetUrl' => $resetUrl,
                    ])->render(),
                    ['password_reset']
                );

                $usedMailer = 'brevo_api';
            } else {
                $this->validateMailConfiguration($mailer);

                Mail::mailer($mailer)->to($user->email)->send(new PasswordResetEmail($user, $resetUrl));

                $usedMailer = $mailer;
            }

            Log::info('Password reset email sent', [
                'user_email' => $user->email,
                'operation' => 'password_reset',
                'mailer' => $usedMailer,
            ]);
        } catch (\Exception $e) {
            Log::error('Password reset email failed', [
                'user_email' => $user->email,
                'operation' => 'password_reset',
                'mailer' => $mailer,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Send OTP email
     *
     * @throws \Exception
     */
    public function sendOTPEmail(User $user, string $otp): void
    {
        $mailer = $this->transactionalMailer();

        try {
            if ($mailer === 'brevo') {
                $this->sendBrevoEmail(
                    $user,
                    'Your Password Reset OTP',
                    view('emails.otp', [
                        'user' => $user,
                        'otp' => $otp,
                    ])->render(),
                    ['password_reset_otp']
                );

                $usedMailer = 'brevo_api';
            } else {
                $this->validateMailConfiguration($mailer);

                Mail::mailer($mailer)->to($user->email)->send(new \App\Mail\OTPEmail($user, $otp));

                $usedMailer = $mailer;
            }

            Log::info('OTP email sent', [
                'user_email' => $user->email,
                'operation' => 'otp_send',
                'mailer' => $usedMailer,
            ]);
        } catch (\Exception $e) {
            Log::error('OTP email failed', [
                'user_email' => $user->email,
                'operation' => 'otp_send',
                'mailer' => $mailer,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Send an email using Brevo's HTTP API.
     *
     * @throws \RuntimeException
     */
    private function sendBrevoEmail(User $user, string $subject, string $htmlContent, array $tags = []): void
    {
        $this->validateMailConfiguration('brevo');

        $apiKey = (string) config('services.brevo.key');
        $fromEmail = (string) config('mail.from.address');
        $fromName = (string) config('mail.from.name');

        $payload = [
            'sender' => [
                'email' => $fromEmail,
                'name' => $fromName,
            ],
            'to' => [
                [
                    'email' => $user->email,
                    'name' => $user->name,
                ],
            ],
            'subject' => $subject,
            'htmlContent' => $htmlContent,
        ];

        if ($tags !== []) {
            $payload['tags'] = $tags;
        }

        $response = Http::withHeaders([
            'accept' => 'application/json',
            'api-key' => $apiKey,
        ])->post('https://api.brevo.com/v3/smtp/email', $payload);

        if (! $response->successful()) {
            throw new \RuntimeException('Brevo API error: '.$response->body());
        }
    }

    /**
     * Build verification URL
     */
    private function buildVerificationUrl(string $token): string
    {
        // For mobile, we need to use the API endpoint that will redirect to the deep link
        // The backend will handle the redirect to the mobile app
        return config('app.url').'/api/email/verify-token?token='.$token;
    }

    /**
     * Build password reset URL
     */
    private function buildPasswordResetUrl(string $token, string $email): string
    {
        return config('app.frontend_url').'/reset-password?token='.$token.'&email='.urlencode($email);
    }
}
