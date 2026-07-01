<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationState extends Model
{
    protected $fillable = [
        'conversation_id', 'object_type', 'needs_ticket', 'title', 'category',
        'ticket_type', 'approval_required', 'priority', 'status', 'assigned_team_id', 'assigned_user_id',
        'current_summary', 'missing_fields_json', 'extracted_fields_json',
        'last_activity_at',
    ];

    protected $casts = [
        'needs_ticket' => 'boolean',
        'approval_required' => 'boolean',
        'missing_fields_json' => 'array',
        'extracted_fields_json' => 'array',
        'last_activity_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
