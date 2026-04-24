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
        // Update the ENUM definition to include the new roles: speler, gamemaster
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'speler', 'pro', 'gamemaster', 'admin') DEFAULT 'speler'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'pro', 'admin') DEFAULT 'user'");
    }
};
