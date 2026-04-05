<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('city', 100)->nullable()->after('phone');

            $table->string('experience_level', 30)->nullable()->after('address');
            $table->string('primary_market', 60)->nullable()->after('experience_level');
            $table->json('budget_segments')->nullable()->after('primary_market');
            $table->decimal('max_ticket_size', 14, 2)->nullable()->after('budget_segments');
            $table->json('buyer_types')->nullable()->after('max_ticket_size');

            $table->text('micro_markets')->nullable()->after('buyer_types');
            $table->text('sell_cities')->nullable()->after('micro_markets');
            $table->unsignedInteger('avg_leads_per_month')->nullable()->after('sell_cities');
            $table->unsignedInteger('avg_site_visits_per_month')->nullable()->after('avg_leads_per_month');
            $table->unsignedInteger('avg_closures_per_month')->nullable()->after('avg_site_visits_per_month');
            $table->enum('selling_style', ['own_leads', 'developer_leads', 'both'])->nullable()->after('avg_closures_per_month');
            $table->enum('activation_intent', ['immediately', 'in_7_days', 'in_15_plus_days', 'exploring'])->nullable()->after('selling_style');
            $table->boolean('commitment_signal')->nullable()->after('activation_intent');
            $table->json('available_slots')->nullable()->after('commitment_signal');
            $table->json('channels_used')->nullable()->after('available_slots');
            $table->unsignedTinyInteger('onboarding_step')->default(1)->after('channels_used');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'city',
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
            ]);
        });
    }
};
