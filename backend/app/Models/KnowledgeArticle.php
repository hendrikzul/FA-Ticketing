<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class KnowledgeArticle extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'symptoms', 'root_cause', 'resolution', 'prevention',
        'related_ticket_ids', 'status', 'author_id', 'approved_by', 'published_at', 'tags',
    ];

    protected $casts = [
        'related_ticket_ids' => 'array',
        'tags' => 'array',
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
