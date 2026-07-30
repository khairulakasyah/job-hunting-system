<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GeneralNote extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'content',
        'position',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(NoteCategory::class, 'category_id');
    }
}
