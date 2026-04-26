<?php

namespace App\Services;

use App\Models\PasswordResetToken;
use App\Models\User;
use App\Models\VerificationToken;

class TokenService
{
    /**
     * Generate a random 32-byte hexadecimal token
     */
    public function generateToken(): string
    {
        try {
            $token = bin2hex(random_bytes(32));
            
            // Verify token has sufficient entropy
            if (strlen($token) !== 64) {
                throw new \Exception('Token generation failed: insufficient length');
            }
            
            // Additional entropy check
            if (substr_count($token, $token[0]) > 32) {
                throw new \Exception('Token generation failed: insufficient randomness');
            }
            
            return $token;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::critical('Token generation failed', ['error' => $e->getMessage()]);
            throw new \RuntimeException('Unable to generate secure token. Please try again.');
        }
    }

    /**
     * Create a verification token for a user
     */
    public function createVerificationToken(User $user): VerificationToken
    {
        $token = $this->generateToken();

        return VerificationToken::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addHours(24),
        ]);
    }

    /**
     * Validate a verification token and return the token model if valid
     */
    public function validateVerificationToken(string $token): ?VerificationToken
    {
        return VerificationToken::valid()
            ->where('token', $token)
            ->first();
    }

    /**
     * Delete all verification tokens for a user
     */
    public function deleteUserVerificationTokens(User $user): void
    {
        VerificationToken::where('user_id', $user->id)->delete();
    }

    /**
     * Create a password reset token for an email
     *
     * @return array ['token' => string, 'hashedToken' => string]
     */
    public function createPasswordResetToken(string $email): array
    {
        $token = \Illuminate\Support\Str::random(64);
        $hashedToken = hash_hmac('sha256', $token, config('app.key'));

        PasswordResetToken::updateOrCreate(
            ['email' => $email],
            [
                'email' => $email,
                'token' => $hashedToken,
                'created_at' => now(),
            ]
        );

        return [
            'token' => $token,
            'hashedToken' => $hashedToken,
        ];
    }

    /**
     * Validate a password reset token
     */
    public function validatePasswordResetToken(string $email, string $token): ?PasswordResetToken
    {
        $resetRecord = PasswordResetToken::where('email', $email)->first();

        if (! $resetRecord) {
            return null;
        }

        if ($resetRecord->isExpired()) {
            $this->deletePasswordResetToken($email);

            return null;
        }

        $hashedToken = hash_hmac('sha256', $token, config('app.key'));
        if (! hash_equals($resetRecord->token, $hashedToken)) {
            return null;
        }

        return $resetRecord;
    }

    /**
     * Delete password reset token for an email
     */
    public function deletePasswordResetToken(string $email): void
    {
        PasswordResetToken::where('email', $email)->delete();
    }
}
