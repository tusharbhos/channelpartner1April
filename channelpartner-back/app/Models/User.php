<?php
// app/Models/User.php

namespace App\Models;

use App\Notifications\VerifyEmailNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'company_name',
        'rera_no',
        'phone',
        'city',
        'address',
        'role',
        'is_active',
        'experience_level',
        'primary_market',
        'budget_segments',
        'max_ticket_size',
        'buyer_types',
        'micro_markets',
        'sell_cities',
        'avg_leads_per_month',
        'avg_site_visits_per_month',
        'avg_closures_per_month',
        'selling_style',
        'activation_intent',
        'commitment_signal',
        'available_slots',
        'channels_used',
        'onboarding_step',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'budget_segments' => 'array',
        'buyer_types' => 'array',
        'available_slots' => 'array',
        'channels_used' => 'array',
        'commitment_signal' => 'boolean',
        'max_ticket_size' => 'decimal:2',
        'avg_leads_per_month' => 'integer',
        'avg_site_visits_per_month' => 'integer',
        'avg_closures_per_month' => 'integer',
        'onboarding_step' => 'integer',
    ];

    // ── Helpers ──────────────────────────────────────────
    // Use our branded email verification
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification());
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isVerified(): bool
    {
        return $this->email_verified_at !== null;
    }
}
