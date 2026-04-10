<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Filesystem\FilesystemAdapter;

class AuthController extends Controller
{
    // ── REGISTER ─────────────────────────────────────────
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_size' => ['required', 'in:individual,1-2,5-10,10-20,20-50,50-100,100+'],
            'rera_no'      => ['required', 'string', 'max:100'],
            'phone'        => ['required', 'string', 'regex:/^\d{10}$/'],
            'city'         => ['required', 'string', 'max:100'],
            'email'        => ['required', 'email', 'unique:users,email'],
            'address'      => ['required', 'string'],
            'password'     => ['required', 'confirmed', Password::min(8)],
        ]);

        $company = Company::firstOrCreate(
            [
                'name' => $validated['company_name'],
                'rera_no' => $validated['rera_no'],
            ],
            [
                'is_active' => true,
            ]
        );

        $companyHasUsers = User::where('company_id', $company->id)->exists();

        $user = User::create([
            'company_id'   => $company->id,
            'name'         => $validated['name'],
            'email'        => $validated['email'],
            'password'     => Hash::make($validated['password']),
            'company_name' => $validated['company_name'],
            'company_size' => $validated['company_size'],
            'rera_no'      => $validated['rera_no'],
            'phone'        => $validated['phone'],
            'city'         => $validated['city'],
            'address'      => $validated['address'],
            'role'         => 'user',
            'is_company_owner' => ! $companyHasUsers,
        ]);

        // Fire registered event → sends email verification for main/company-owner account.
        event(new Registered($user));

        return response()->json([
            'message' => 'Registration successful! Please verify your email.',
            'user'    => $this->formatUser($user),
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

        /** @var User|null $user */
        $user = Auth::user();

        if (! $user instanceof User) {
            Auth::logout();
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (! $user->is_active) {
            Auth::logout();
            return response()->json([
                'message' => 'Your account has been disabled. Contact admin.',
            ], 403);
        }

        if ($this->requiresEmailVerification($user) && ! $user->hasVerifiedEmail()) {
            Auth::logout();
            return response()->json([
                'message' => 'Please verify your email before logging in.',
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

    // ── FORGOT PASSWORD: SEND CODE ───────────────────────
    public function sendForgotPasswordCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $email = strtolower(trim($validated['email']));
        $targetUser = User::where('email', $email)->firstOrFail();
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $cpCode = 'CP-' . $code;

        DB::table('password_reset_codes')->updateOrInsert(
            ['email' => $email],
            [
                'company_id' => $targetUser->company_id,
                'company_name' => $targetUser->company_name,
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(15),
                'attempts' => 0,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        Mail::raw(
            "Your ChannelPartner.Network password reset code is {$cpCode}. This code will expire in 15 minutes.",
            function ($message) use ($email) {
                $message->to($email)
                    ->subject('ChannelPartner Password Reset Code');
            }
        );

        return response()->json([
            'message' => 'Password reset code sent to your email.',
        ]);
    }

    // ── FORGOT PASSWORD: RESET WITH CODE ─────────────────
    public function resetPasswordWithCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'code' => ['required', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $email = strtolower(trim($validated['email']));
        $cleanedCode = preg_replace('/\D/', '', $validated['code'] ?? '');

        if (! $cleanedCode || strlen($cleanedCode) !== 6) {
            return response()->json([
                'message' => 'Invalid code format.',
            ], 422);
        }

        $reset = DB::table('password_reset_codes')->where('email', $email)->first();

        if (! $reset) {
            return response()->json([
                'message' => 'Invalid or expired code.',
            ], 422);
        }

        if (now()->gt($reset->expires_at)) {
            DB::table('password_reset_codes')->where('email', $email)->delete();
            return response()->json([
                'message' => 'Code expired. Please request a new code.',
            ], 422);
        }

        if (! Hash::check($cleanedCode, $reset->code_hash)) {
            DB::table('password_reset_codes')
                ->where('email', $email)
                ->update([
                    'attempts' => (int) $reset->attempts + 1,
                    'updated_at' => now(),
                ]);

            return response()->json([
                'message' => 'Invalid code.',
            ], 422);
        }

        $user = User::where('email', $email)->firstOrFail();
        $user->password = Hash::make($validated['password']);
        $user->save();

        $user->tokens()->delete();
        DB::table('password_reset_codes')->where('email', $email)->delete();

        return response()->json([
            'message' => 'Password reset successful. Please login with your new password.',
        ]);
    }

    // ── LOGOUT ────────────────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $user = $this->authenticatedUser($request);
        /** @var PersonalAccessToken|null $token */
        $token = $user->currentAccessToken();
        $token?->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    // ── GET PROFILE ───────────────────────────────────────
    public function me(Request $request): JsonResponse
    {
        $user = $this->authenticatedUser($request);

        return response()->json([
            'user'           => $this->formatUser($user),
            'email_verified' => $user->hasVerifiedEmail(),
        ]);
    }

    // ── UPDATE PROFILE / ONBOARDING ──────────────────────
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->authenticatedUser($request);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'company_name' => ['sometimes', 'string', 'max:255'],
            'company_size' => ['sometimes', 'nullable', 'in:individual,1-2,5-10,10-20,20-50,50-100,100+'],
            'profile_image' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'rera_no' => ['sometimes', 'string', 'max:100'],
            'phone' => ['sometimes', 'string', 'regex:/^\d{10}$/'],
            'city' => ['sometimes', 'string', 'max:100'],
            'address' => ['sometimes', 'string'],

            'experience_level' => ['sometimes', 'nullable', 'string', 'max:30'],
            'primary_market' => ['sometimes', 'nullable', 'array'],
            'primary_market.*' => ['string', 'max:60'],
            'budget_segments' => ['sometimes', 'nullable', 'array'],
            'budget_segments.*' => ['in:Affordable,Regular (50L-1.5CR),Premium (1.5CR-5CR),Luxury (5CR-10CR),Ultra Luxury (10CR+)'],
            'max_ticket_size' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'buyer_types' => ['sometimes', 'nullable', 'array'],
            'buyer_types.*' => ['string', 'max:30'],
            'project_preference' => ['sometimes', 'nullable', 'array'],
            'project_preference.*' => ['in:New Launch,Pre Launch,Under Construction,Nearing Possession,Ready to Move'],

            'micro_markets' => ['sometimes', 'nullable', 'string'],
            'sell_cities' => ['sometimes', 'nullable', 'string'],
            'avg_leads_per_month' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'avg_site_visits_per_month' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'avg_closures_per_month' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'selling_style' => ['sometimes', 'nullable', 'array'],
            'selling_style.*' => ['in:own_leads,developer_leads,both,referral,channel_partner,portal'],
            'onboarding_step' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:3'],
        ]);

        if ($request->hasFile('profile_image')) {
            /** @var FilesystemAdapter $publicDisk */
            $publicDisk = Storage::disk('public');

            if ($user->profile_image) {
                $publicDisk->delete($user->profile_image);
            }

            $validated['profile_image'] = $request->file('profile_image')->store('profile-images', 'public');
        }

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
        $user = $this->authenticatedUser($request);

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification email sent.']);
    }

    // ── Helper ────────────────────────────────────────────
    private function formatUser(User $user): array
    {
        $requiresVerification = $this->requiresEmailVerification($user);
        /** @var FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');

        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'company_name'   => $user->company_name,
            'company_size'   => $user->company_size,
            'profile_image'  => $user->profile_image,
            'profile_image_url' => $user->profile_image ? $publicDisk->url($user->profile_image) : null,
            'rera_no'        => $user->rera_no,
            'company_id'     => $user->company_id,
            'is_company_owner' => (bool) $user->is_company_owner,
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
            'project_preference' => $user->project_preference,
            'micro_markets' => $user->micro_markets,
            'sell_cities' => $user->sell_cities,
            'avg_leads_per_month' => $user->avg_leads_per_month,
            'avg_site_visits_per_month' => $user->avg_site_visits_per_month,
            'avg_closures_per_month' => $user->avg_closures_per_month,
            'selling_style' => $user->selling_style,
            'onboarding_step' => $user->onboarding_step,
            'email_verified' => $requiresVerification ? $user->hasVerifiedEmail() : true,
            'created_at'     => $user->created_at?->toDateTimeString(),
        ];
    }

    private function requiresEmailVerification(User $user): bool
    {
        // Main registration account (company owner / non-company users) must verify email.
        // Company users created under an owner are allowed to login without verification.
        if ($user->is_company_owner) {
            return true;
        }

        if (! $user->company_id) {
            return true;
        }

        return false;
    }

    private function authenticatedUser(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401, 'Unauthenticated.');
        }

        return $user;
    }
}
