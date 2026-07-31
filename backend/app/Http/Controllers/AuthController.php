<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $credentials = $request->only('email', 'password');

            if (!Auth::attempt($credentials)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password.',
                ], 401);
            }

            $user = Auth::user();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful.',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function user(Request $request): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'User retrieved successfully.',
                'data' => $request->user(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function register(\App\Http\Requests\RegisterRequest $request): JsonResponse
    {
        try {
            $user = \App\Models\User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => bcrypt($request->password),
            ]);

            $user->sendEmailVerificationNotification();

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Account created successfully. A verification email has been sent.',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateProfile(\App\Http\Requests\UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();

            $user->update($request->only([
                'name', 'email', 'resume_url', 'portfolio_url', 'linkedin_url',
                'github_url', 'preferred_platform', 'preferred_location',
                'salary_expectation', 'target_role', 'onboarding_completed',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully.',
                'data' => $user->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function changePassword(\App\Http\Requests\ChangePasswordRequest $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect.',
                ], 422);
            }

            $user->update([
                'password' => bcrypt($request->new_password),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            $status = Password::sendResetLink($request->only('email'));

            return response()->json([
                'success' => true,
                'message' => $status === Password::RESET_LINK_SENT
                    ? 'Password reset link sent to your email.'
                    : 'If that email is registered, a password reset link has been sent.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password' => bcrypt($password),
                    ])->save();
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'success' => true,
                    'message' => 'Password has been reset successfully.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset token.',
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function verifyEmail(Request $request, string $id, string $hash): \Illuminate\Http\Response
    {
        $user = User::findOrFail($id);

        if (! hash_equals((string) sha1($user->getEmailForVerification()), (string) $hash)) {
            abort(403, 'Invalid verification link.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        $html = <<<HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verified - Job Hunter</title>
            <meta http-equiv="refresh" content="5; url={$frontendUrl}">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background: #0B1120; color: #E2E8F0;
                    min-height: 100vh; display: flex; align-items: center; justify-content: center;
                }
                .card { text-align: center; padding: 48px 32px; max-width: 400px; }
                .icon {
                    width: 64px; height: 64px; margin: 0 auto 24px; border-radius: 20px;
                    background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center;
                }
                .icon svg { width: 32px; height: 32px; stroke: #34D399; }
                h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
                p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 32px; }
                a.button {
                    display: inline-block; background: #6366F1; color: #fff; text-decoration: none;
                    padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600;
                    transition: background 0.15s;
                }
                a.button:hover { background: #4F46E5; }
                .note { margin-top: 20px; font-size: 12px; color: #64748B; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </div>
                <h1>Email verified</h1>
                <p>Your email address has been successfully verified. You're all set to continue.</p>
                <a class="button" href="{$frontendUrl}">Continue to Job Hunter</a>
                <div class="note">You'll be redirected in a few seconds…</div>
            </div>
        </body>
        </html>
        HTML;

        return response($html)->header('Content-Type', 'text/html');
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if ($user->hasVerifiedEmail()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Your email is already verified.',
                ]);
            }

            $user->sendEmailVerificationNotification();

            return response()->json([
                'success' => true,
                'message' => 'Verification email sent. Check your inbox.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
