<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Conversation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'created_by', 'status', 'conversation_mode', 'object_type',
        'object_id', 'is_private', 'last_activity_at',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'last_activity_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot('role', 'last_read_at')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function watchers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'watchers')
            ->withPivot('is_active')
            ->withTimestamps();
    }

    public function state(): HasOne
    {
        return $this->hasOne(ConversationState::class);
    }

    public function ticket(): HasOne
    {
        return $this->hasOne(Ticket::class)->latestOfMany();
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function aiSummaries(): HasMany
    {
        return $this->hasMany(AiSummary::class);
    }
}
