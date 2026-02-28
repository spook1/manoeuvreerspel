<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Harbor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'json_data', // De volledige JSON blob van de editor
        'is_public', // Mag iedereen hem zien?
        'is_official', // Is het een default level?
    ];

    protected $casts = [
        'json_data' => 'array', // Laravel cast JSON automatisch naar array/object
        'is_public' => 'boolean',
        'is_official' => 'boolean',
    ];

    // Relatie: Een haven hoort bij een gebruiker
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
