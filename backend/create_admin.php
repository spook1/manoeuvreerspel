<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::firstOrCreate(
    ['email' => 'admin@manoeuvreerspel.local'],
    ['name' => 'Super Admin', 'password' => \Illuminate\Support\Facades\Hash::make('password')]
);

$user->role = 'admin';
$user->save();

echo "User {$user->email} is created/updated with role admin. Password is 'password'.";
