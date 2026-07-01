<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Attachment;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'conversation_id', 'ticket_number', 'title', 'description',
        'ticket_type', 'category', 'priority', 'status', 'is_draft', 'approval_required', 'reported_by',
        'assigned_team_id', 'assigned_user_id',
        'due_at', 'resolved_at', 'closed_at', 'tags', 'url', 'estimation',
    ];

    protected $casts = [
        'is_draft' => 'boolean',
        'approval_required' => 'boolean',
        'due_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'tags' => 'array',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignedTeam(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'assigned_team_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(TicketStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TicketAssignment::class)->orderBy('created_at', 'desc');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Ticket $ticket) {
            if (empty($ticket->ticket_number)) {
                $last = static::latest('id')->first();
                $next = $last ? $last->id + 1 : 1;
                $ticket->ticket_number = 'TKT-' . str_pad((string) $next, 5, '0', STR_PAD_LEFT);
            }
        });
    }
}
