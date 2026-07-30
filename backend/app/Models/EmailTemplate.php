<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailTemplate extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'user_id',
        'name',
        'subject',
        'body',
        'variables',
    ];

    protected $casts = [
        'variables' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
