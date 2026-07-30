<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check');
        DB::statement('ALTER TABLE jobs ALTER COLUMN status TYPE VARCHAR(20)');
        DB::statement("ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'saved'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check");
        DB::statement("ALTER TABLE jobs ALTER COLUMN status TYPE VARCHAR(20)");
        DB::statement("ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('saved', 'applied', 'interview', 'offer', 'rejected'))");
        DB::statement("ALTER TABLE jobs ALTER COLUMN status SET DEFAULT 'saved'");
    }
};
