<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // ── REGISTER ─────────────────────────────────────────
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'company_name' => ['required', 'string', 'max:255'],
            'rera_no'      => ['required', 'string', 'max:100'],
            'phone'        => ['required', 'string', 'regex:/^\d{10}$/'],
            'email'        => ['required', 'email', 'unique:users,email'],
            'address'      => ['required', 'string'],
            'password'     => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name'         => $validated['name'],
            'email'        => $validated['email'],
            'password'     => Hash::make($validated['password']),
            'company_name' => $validated['company_name'],
            'rera_no'      => $validated['rera_no'],
            'phone'        => $validated['phone'],
            'address'      => $validated['address'],
            'role'         => 'user',
        ]);

        // Fire registered event → sends email verification
        event(new Registered($user));

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful! Please verify your email.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ], 201);
    }

    // ── LOGIN ─────────────────────────────────────────────
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            return response()->json([
                'message' => 'Your account has been disabled. Contact admin.',
            ], 403);
        }

        // Revoke old tokens (single device login)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'        => 'Login successful.',
            'user'           => $this->formatUser($user),
            'token'          => $token,
            'email_verified' => $user->hasVerifiedEmail(),
        ]);
    }

    // ── LOGOUT ────────────────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    // ── GET PROFILE ───────────────────────────────────────
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user'           => $this->formatUser($request->user()),
            'email_verified' => $request->user()->hasVerifiedEmail(),
        ]);
    }

    // ── VERIFY EMAIL ──────────────────────────────────────
    public function verifyEmail(Request $request, $id, $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return response()->json(['message' => 'Invalid verification link.'], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->markEmailAsVerified();

        return response()->json(['message' => 'Email verified successfully! You can now access all features.']);
    }

    // ── RESEND VERIFICATION EMAIL ─────────────────────────
    public function resendVerification(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email sent.']);
    }

    // ── Helper ────────────────────────────────────────────
    private function formatUser(User $user): array
    {
        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'company_name'   => $user->company_name,
            'rera_no'        => $user->rera_no,
            'phone'          => $user->phone,
            'address'        => $user->address,
            'role'           => $user->role,
            'is_active'      => $user->is_active,
            'email_verified' => $user->hasVerifiedEmail(),
            'created_at'     => $user->created_at?->toDateTimeString(),
        ];
    }
}