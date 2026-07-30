<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_timelines', function (Blueprint $table) {
            $table->text('meeting_link')->nullable()->change();
        });

        Schema::table('job_attachments', function (Blueprint $table) {
            $table->unsignedBigInteger('file_size')->change();
        });
    }

    public function down(): void
    {
        Schema::table('job_timelines', function (Blueprint $table) {
            $table->string('meeting_link', 500)->nullable()->change();
        });

        Schema::table('job_attachments', function (Blueprint $table) {
            $table->bigInteger('file_size')->change();
        });
    }
};
