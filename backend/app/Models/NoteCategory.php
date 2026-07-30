<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NoteCategory extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'color',
        'position',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function notes()
    {
        return $this->hasMany(GeneralNote::class, 'category_id')->orderBy('position');
    }
}
