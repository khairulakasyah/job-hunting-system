<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('job_notes', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('job_attachments', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('email_templates', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('general_notes', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('job_notes', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('job_attachments', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('email_templates', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('general_notes', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
