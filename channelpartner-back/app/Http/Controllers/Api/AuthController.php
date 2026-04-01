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
            'city'         => ['required', 'string', 'max:100'],
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
            'city'         => $validated['city'],
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

    // ── UPDATE PROFILE / ONBOARDING ──────────────────────
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'company_name' => ['sometimes', 'string', 'max:255'],
            'rera_no' => ['sometimes', 'string', 'max:100'],
            'phone' => ['sometimes', 'string', 'regex:/^\d{10}$/'],
            'city' => ['sometimes', 'string', 'max:100'],
            'address' => ['sometimes', 'string'],

            'experience_level' => ['sometimes', 'nullable', 'string', 'max:30'],
            'primary_market' => ['sometimes', 'nullable', 'string', 'max:60'],
            'budget_segments' => ['sometimes', 'nullable', 'array'],
            'budget_segments.*' => ['string', 'max:30'],
            'max_ticket_size' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'buyer_types' => ['sometimes', 'nullable', 'array'],
            'buyer_types.*' => ['string', 'max:30'],

            'micro_markets' => ['sometimes', 'nullable', 'string'],
            'sell_cities' => ['sometimes', 'nullable', 'string'],
            'avg_leads_per_month' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'avg_site_visits_per_month' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'avg_closures_per_month' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'selling_style' => ['sometimes', 'nullable', 'in:own_leads,developer_leads,both'],
            'activation_intent' => ['sometimes', 'nullable', 'in:immediately,in_7_days,in_15_plus_days,exploring'],
            'commitment_signal' => ['sometimes', 'nullable', 'boolean'],
            'available_slots' => ['sometimes', 'nullable', 'array'],
            'available_slots.*' => ['string', 'max:40'],
            'channels_used' => ['sometimes', 'nullable', 'array'],
            'channels_used.*' => ['string', 'max:50'],
            'onboarding_step' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:3'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->formatUser($user->fresh()),
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
            'city'           => $user->city,
            'address'        => $user->address,
            'role'           => $user->role,
            'is_active'      => $user->is_active,
            'experience_level' => $user->experience_level,
            'primary_market' => $user->primary_market,
            'budget_segments' => $user->budget_segments,
            'max_ticket_size' => $user->max_ticket_size,
            'buyer_types' => $user->buyer_types,
            'micro_markets' => $user->micro_markets,
            'sell_cities' => $user->sell_cities,
            'avg_leads_per_month' => $user->avg_leads_per_month,
            'avg_site_visits_per_month' => $user->avg_site_visits_per_month,
            'avg_closures_per_month' => $user->avg_closures_per_month,
            'selling_style' => $user->selling_style,
            'activation_intent' => $user->activation_intent,
            'commitment_signal' => $user->commitment_signal,
            'available_slots' => $user->available_slots,
            'channels_used' => $user->channels_used,
            'onboarding_step' => $user->onboarding_step,
            'email_verified' => $user->hasVerifiedEmail(),
            'created_at'     => $user->created_at?->toDateTimeString(),
        ];
    }
}
