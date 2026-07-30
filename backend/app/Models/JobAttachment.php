<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobAttachment extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'job_id',
        'user_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
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
