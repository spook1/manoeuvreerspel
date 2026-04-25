<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("UPDATE users SET role = 'speler' WHERE role = 'student'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'speler', 'pro', 'gamemaster', 'admin', 'super_admin') DEFAULT 'speler'");
        DB::statement("UPDATE users SET role = 'super_admin' WHERE role = 'admin'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE users SET role = 'admin' WHERE role = 'super_admin'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'speler', 'pro', 'gamemaster', 'admin') DEFAULT 'speler'");
    }
};
