<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSkill extends Model
{
    protected $table = 'ai_skills';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name', 'display_name', 'description', 'github_url',
        'version', 'entrypoint', 'scope', 'user_id',
        'is_active', 'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
