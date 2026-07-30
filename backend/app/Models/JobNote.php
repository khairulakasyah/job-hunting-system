<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobNote extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'job_id',
        'user_id',
        'content',
        'pinned',
    ];

    protected $casts = [
        'pinned' => 'boolean',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
