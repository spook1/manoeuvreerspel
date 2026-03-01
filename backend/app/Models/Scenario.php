<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Scenario extends Model
{
    protected $fillable = [
        'user_id',
        'harbor_id',
        'name',
        'description',
        'points',
        'time_limit',
        'json_data'
    ];

    protected $casts = [
        'json_data' => 'array',
        'points' => 'integer',
        'time_limit' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function harbor()
    {
        return $this->belongsTo(Harbor::class);
    }

    public function games()
    {
        return $this->belongsToMany(Game::class, 'game_scenario')->withPivot('order');
    }
}
