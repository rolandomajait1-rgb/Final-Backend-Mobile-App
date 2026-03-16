<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class AuthController extends Controller
{
    private AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function showLoginForm(): Response
    {
        return view('auth.login');
    }

    public function login(LoginRequest $request): Response
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        if (is_null($user->email_verified_at)) {
            return back()->withErrors([
                'email' => 'Please verify your email before logging in. Check your inbox for the verification link.',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    public function loginApi(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            // Constant-time response to prevent user enumeration via timing attacks
            usleep(random_int(100000, 300000));

            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        Auth::login($user);

        if (is_null($user->email_verified_at)) {
            Auth::logout();

            return response()->json([
                'message' => 'Please verify your email before logging in. Check your inbox for verification link.',
                'requires_verification' => true,
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['token' => $token, 'role' => $user->role, 'user' => $user]);
    }

    public function showRegistrationForm(): Response
    {
        return view('auth.register');
    }

    public function register(RegisterRequest $request): Response
    {
        try {
            $this->authService->createUserWithVerification($request->validated());

            return redirect('/verification-pending')->with('success', 'Registration successful! Please check your email to verify your account.');
        } catch (\Exception $e) {
            $message = $this->registrationFailureMessage($e);

            return back()->withErrors([
                'email' => $message,
            ]);
        }
    }

    public function registerApi(RegisterRequest $request): JsonResponse
    {
        try {
            $user = $this->authService->createUserWithVerification($request->validated());

            return response()->json([
                'message' => 'Registration successful! Please check your email to verify your account before logging in.',
                'user_id' => $user->id,
            ], 201);
        } catch (\Exception $e) {
            $message = $this->registrationFailureMessage($e);
            $statusCode = $this->registrationFailureStatusCode($e);

            return response()->json([
                'message' => $message,
            ], $statusCode);
        }
    }

    public function logout(Request $request): Response
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function logoutApi(Request $request): JsonResponse
    {
        $request->user()->tokens()->where('id', $request->user()->currentAccessToken()->id)->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function changePasswordApi(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->changePassword(
                $request->user(),
                $request->current_password,
                $request->password
            );

            if (! $result['success']) {
                return response()->json(['message' => $result['message']], 400);
            }

            return response()->json(['message' => $result['message']]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Password change failed'], 500);
        }
    }

    public function deleteAccountApi(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        try {
            $result = $this->authService->deleteAccount(
                $request->user(),
                $request->password
            );

            if (! $result['success']) {
                return response()->json(['message' => $result['message']], 400);
            }

            return response()->json(['message' => $result['message']]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Account deletion failed'], 500);
        }
    }

    public function verifyEmailToken(Request $request): JsonResponse|RedirectResponse|Response
    {
        try {
            $token = $request->query('token');

            if (!$token) {
                $frontendUrl = config('app.frontend_url') ?? 'http://localhost:5173';
                return redirect($frontendUrl.'/login?error=invalid_token');
            }

            // Check for rate limiting by IP
            $cacheKey = 'verify_attempts_'.$request->ip();
            $attempts = Cache::get($cacheKey, 0);

            if ($attempts >= 10) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Too many verification attempts. Please try again later.'], 429);
                }
                $frontendUrl = config('app.frontend_url') ?? 'http://localhost:5173';
                return redirect($frontendUrl.'/login?error=too_many_attempts');
            }

            $result = $this->authService->verifyUserEmail($token);

            $frontendUrl = config('app.frontend_url') ?? 'http://localhost:5173';

            if (! $result['success']) {
                Cache::put($cacheKey, $attempts + 1, now()->addMinutes(15));

                $errorMessage = $result['message'];
                
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Email verification failed: '.$errorMessage], 400);
                }
                
                if ($errorMessage === 'already_verified') {
                    return redirect($frontendUrl.'/login?verified=1&message=already_verified');
                }

                return redirect($frontendUrl.'/login?error='.$errorMessage);
            }

            // Clear rate limit on successful verification
            Cache::forget($cacheKey);

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Email verified successfully!', 'verified' => true], 200);
            }

            return redirect($frontendUrl.'/login?verified=1');
        } catch (\Exception $e) {
            Log::error('Email verification error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            $frontendUrl = config('app.frontend_url') ?? 'http://localhost:5173';
            return redirect($frontendUrl.'/login?error=verification_error');
        }
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $result = $this->authService->resendVerification($request->email);

        return response()->json([
            'message' => $result['message'],
        ], 200);
    }

    public function forgotPasswordApi(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $result = $this->authService->initiatePasswordReset($request->email);

        return response()->json([
            'message' => $result['message'],
        ], 200);
    }

    public function resetPasswordApi(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->resetPassword(
                $request->email,
                $request->token,
                $request->password
            );

            if (! $result['success']) {
                $statusCode = $result['message'] === 'User not found' ? 404 : 400;

                return response()->json(['message' => $result['message']], $statusCode);
            }

            return response()->json(['message' => $result['message']], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Password reset failed'], 500);
        }
    }

    private function registrationFailureMessage(\Throwable $exception): string
    {
        if ($this->isMailServiceException($exception)) {
            return 'Registration is temporarily unavailable because verification email could not be sent. Please try again shortly.';
        }
        return 'Registration failed: ' . $exception->getMessage();
    }

    private function registrationFailureStatusCode(\Throwable $exception): int
    {
        return $this->isMailServiceException($exception) ? 503 : 500;
    }

    private function isMailServiceException(\Throwable $exception): bool
    {
        if ($exception instanceof TransportExceptionInterface) {
            return true;
        }

        if ($exception instanceof \RuntimeException &&
            str_contains($exception->getMessage(), 'Mail configuration')) {
            return true;
        }

        $message = strtolower($exception->getMessage());

        return str_contains($message, 'unable to send an email') ||
            str_contains($message, 'smtp');
    }
}
