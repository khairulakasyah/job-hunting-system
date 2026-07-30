<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class JobTimeline extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'stage',
        'stage_date',
        'event_type',
        'scheduled_at',
        'location',
        'meeting_link',
    ];

    protected $casts = [
        'stage_date' => 'date',
        'scheduled_at' => 'datetime',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }
}
