<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $fillable = [
        'conversation_id', 'parent_id', 'sender_type', 'sender_id',
        'message_type', 'body_text', 'body_json', 'metadata',
    ];

    protected $casts = [
        'body_json' => 'array',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::created(function (Message $message) {
            if ($message->parent_id) {
                Message::where('id', $message->parent_id)->increment('thread_reply_count');
            }
        });
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    public function mentions(): HasMany
    {
        return $this->hasMany(Mention::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }
}
