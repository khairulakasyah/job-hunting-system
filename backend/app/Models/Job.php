<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Job extends Model
{
    use HasFactory, SoftDeletes;

    const ACTIVE = 2;
    const INACTIVE = 1;

    protected $fillable = [
        'user_id',
        'company_name',
        'job_title',
        'location',
        'url',
        'job_description',
        'salary',
        'job_platform',
        'status',
        'active_status',
        'applied_date',
    ];

    protected $casts = [
        'applied_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function timelines()
    {
        return $this->hasMany(JobTimeline::class)->orderBy('stage_date', 'asc');
    }

    public function attachments()
    {
        return $this->hasMany(JobAttachment::class);
    }

    public function notes()
    {
        return $this->hasMany(JobNote::class);
    }
}