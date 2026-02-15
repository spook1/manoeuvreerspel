<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Voeg rol toe: user (default), pro, admin
            $table->enum('role', ['user', 'pro', 'admin'])->default('user')->after('email');
            
            // Optioneel: max_shared_harbors tracker voor gratis users
            $table->integer('shared_harbors_count')->default(0)->after('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'shared_harbors_count']);
        });
    }
};
