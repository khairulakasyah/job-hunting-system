<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('resume_url')->nullable()->after('email');
            $table->string('portfolio_url')->nullable()->after('resume_url');
            $table->string('linkedin_url')->nullable()->after('portfolio_url');
            $table->string('github_url')->nullable()->after('linkedin_url');
            $table->string('preferred_platform')->nullable()->after('github_url');
            $table->string('preferred_location')->nullable()->after('preferred_platform');
            $table->string('salary_expectation')->nullable()->after('preferred_location');
            $table->string('target_role')->nullable()->after('salary_expectation');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'resume_url', 'portfolio_url', 'linkedin_url', 'github_url',
                'preferred_platform', 'preferred_location', 'salary_expectation', 'target_role',
            ]);
        });
    }
};
