<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_timelines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')
                  ->constrained('jobs')
                  ->onDelete('cascade');
            $table->string('status');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_timelines');
    }
};