<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OTPEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $otp,
        public string $type = 'password_reset',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->type === 'email_verification' ? 'Your Email Verification OTP' : 'Your Password Reset OTP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: [
                'user' => $this->user,
                'otp' => $this->otp,
                'type' => $this->type,
            ],
        );
    }
}
