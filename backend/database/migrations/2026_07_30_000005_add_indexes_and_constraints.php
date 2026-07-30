<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // -- Indexes on FK columns --

        Schema::table('jobs', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('job_timelines', function (Blueprint $table) {
            $table->index('job_id');
        });

        Schema::table('job_notes', function (Blueprint $table) {
            $table->index('job_id');
            $table->index('user_id');
        });

        Schema::table('job_attachments', function (Blueprint $table) {
            $table->index('job_id');
            $table->index('user_id');
        });

        Schema::table('email_templates', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('note_categories', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('general_notes', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('category_id');
        });

        // -- Unique constraints --

        Schema::table('email_templates', function (Blueprint $table) {
            $table->unique(['user_id', 'name']);
        });

        Schema::table('note_categories', function (Blueprint $table) {
            $table->unique(['user_id', 'name']);
        });

        // -- Make stage_date nullable --

        Schema::table('job_timelines', function (Blueprint $table) {
            $table->date('stage_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('job_timelines', function (Blueprint $table) {
            $table->dropIndex(['job_id']);
            $table->date('stage_date')->nullable(false)->change();
        });

        Schema::table('job_notes', function (Blueprint $table) {
            $table->dropIndex(['job_id']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('job_attachments', function (Blueprint $table) {
            $table->dropIndex(['job_id']);
            $table->dropIndex(['user_id']);
        });

        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropUnique(['user_id', 'name']);
        });

        Schema::table('note_categories', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropUnique(['user_id', 'name']);
        });

        Schema::table('general_notes', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['category_id']);
        });
    }
};
