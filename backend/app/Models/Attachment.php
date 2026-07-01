<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $fillable = [
        'message_id', 'conversation_id', 'ticket_id', 'filename',
        'mime_type', 'size_bytes', 'storage_path', 'uploaded_by',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        return \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'attachments.file',
            now()->addHours(24),
            ['attachment' => $this->id]
        );
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
