<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_timelines', function (Blueprint $table) {
            $table->string('event_type')->nullable()->after('stage');
            $table->timestamp('scheduled_at')->nullable()->after('stage_date');
            $table->string('location', 255)->nullable()->after('scheduled_at');
            $table->string('meeting_link', 500)->nullable()->after('location');
        });
    }

    public function down(): void
    {
        Schema::table('job_timelines', function (Blueprint $table) {
            $table->dropColumn(['event_type', 'scheduled_at', 'location', 'meeting_link']);
        });
    }
};
