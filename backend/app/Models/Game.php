<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'user_id',
        'is_public',
        'is_official',
        'start_points',
        'target_points',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_official' => 'boolean',
        'start_points' => 'integer',
        'target_points' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scenarios()
    {
        return $this->belongsToMany(Scenario::class, 'game_scenario')->withPivot('order')->orderBy('game_scenario.order');
    }
}
