<?php

namespace App\Http\Controllers\Api;

use App\Models\ConversationState;
use App\Models\Notification;
use App\Models\Ticket;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends \App\Http\Controllers\Controller
{
    /**
     * Create a new ticket manually (non-AI flow).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'ticket_type'    => 'required|in:bugfix,development,maintenance',
            'category'       => 'nullable|string',
            'priority'       => 'nullable|in:P1,P2,P3,P4',
            'assigned_user_id' => 'nullable|exists:users,id',
            'assigned_team_id' => 'nullable|exists:divisions,id',
            'tags'           => 'nullable|array',
            'due_at'         => 'nullable|date',
            'url'            => 'nullable|string|url|max:500',
        ]);

        $ticket = Ticket::create([
            'ticket_number'    => 'TKT-' . str_pad(Ticket::max('id') + 1, 5, '0', STR_PAD_LEFT),
            'title'            => $validated['title'],
            'description'      => $validated['description'] ?? null,
            'ticket_type'      => $validated['ticket_type'],
            'category'         => $validated['category'] ?? null,
            'priority'         => $validated['priority'] ?? 'P4',
            'status'           => 'new',
            'is_draft'         => false,
            'reported_by'       => $request->user()->id,
            'assigned_user_id'  => $validated['assigned_user_id'] ?? null,
            'assigned_team_id'  => $validated['assigned_team_id'] ?? null,
            'tags'             => $validated['tags'] ?? null,
            'due_at'           => $validated['due_at'] ?? null,
        ]);

        // Handle file attachments
        $files = [];
        if ($request->hasFile('file')) {
            $files[] = $request->file('file');
        }
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $f) {
                $files[] = $f;
            }
        }
        foreach ($files as $uploadedFile) {
            $path = $uploadedFile->store('ticket-attachments');
            $ticket->attachments()->create([
                'ticket_id' => $ticket->id,
                'filename' => $uploadedFile->getClientOriginalName(),
                'mime_type' => $uploadedFile->getMimeType(),
                'storage_path' => $path,
                'size_bytes' => $uploadedFile->getSize(),
            ]);
        }

        AuditService::log('created', 'ticket', $ticket->id, $request->user()->id, [], [
            'title' => $ticket->title,
            'priority' => $ticket->priority,
        ]);

        $ticket->load(['reporter:id,name,username', 'assignedUser:id,name,username', 'assignedTeam:id,name']);

        // Notify assigned user
        if ($ticket->assigned_user_id) {
            \App\Models\Notification::create([
                'user_id' => $ticket->assigned_user_id,
                'type' => 'ticket_assigned',
                'title' => "You've been assigned to {$ticket->ticket_number}",
                'body' => "\"{$ticket->title}\" — Priority: {$ticket->priority}",
                'ticket_id' => $ticket->id,
            ]);
        }

        // Notify reporter
        if ($ticket->reported_by && $ticket->reported_by !== $ticket->assigned_user_id) {
            \App\Models\Notification::create([
                'user_id' => $ticket->reported_by,
                'type' => 'ticket_created',
                'title' => "Ticket {$ticket->ticket_number} created",
                'body' => "\"{$ticket->title}\" has been created with priority {$ticket->priority}.",
                'ticket_id' => $ticket->id,
            ]);
        }

        return response()->json(['data' => $ticket], 201);
    }

    /**
     * List tickets with filters (supports Kanban columns).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::query()
            ->with(['reporter:id,name,username', 'assignedUser:id,name,username', 'assignedTeam:id,name']);

        // Filter by status (Kanban column)
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by type
        if ($request->has('ticket_type')) {
            $query->where('ticket_type', $request->get('ticket_type'));
        }

        // Filter by priority
        if ($request->has('priority')) {
            $query->where('priority', $request->get('priority'));
        }

        // Filter by assignee (my tickets)
        if ($request->has('assigned_to')) {
            $query->where('assigned_user_id', $request->get('assigned_to'));
        }

        // Filter by team
        if ($request->has('team_id')) {
            $query->where('assigned_team_id', $request->get('team_id'));
        }

        // My reported tickets
        if ($request->has('reported_by')) {
            $query->where('reported_by', $request->get('reported_by'));
        }

        // Search
        if ($request->has('q')) {
            $search = $request->get('q');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%")
                  ->orWhere('ticket_number', 'ilike', "%{$search}%");
            });
        }

        // Group by status for Kanban
        if ($request->get('group_by') === 'status') {
            $grouped = $query->orderBy('created_at', 'desc')->get()->groupBy('status');

            // Ensure all Kanban columns exist
            $kanbanColumns = ['new', 'triaged', 'waiting_approval', 'queued', 'in_progress', 'waiting_user', 'waiting_vendor', 'resolved', 'closed', 'rejected', 'cancelled'];
            $result = [];
            foreach ($kanbanColumns as $col) {
                $result[$col] = $grouped->get($col, []);
            }

            return response()->json(['data' => $result]);
        }

        $tickets = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($tickets);
    }

    /**
     * Show ticket detail.
     */
    public function show(Ticket $ticket): JsonResponse
    {
        $ticket->load([
            'reporter:id,name,username,email',
            'assignedUser:id,name,username,email',
            'assignedTeam:id,name',
            'statusHistory.changedBy:id,name',
            'assignments.assignedTo:id,name',
            'assignments.assignedBy:id,name',
            'comments.user:id,name,username,avatar_url',
            'conversation.messages' => fn($q) => $q->orderBy('created_at', 'asc')->limit(20),
        ]);

        return response()->json(['data' => $ticket]);
    }

    /**
     * Update ticket status (for Kanban drag-and-drop).
     */
    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:new,triaged,waiting_approval,queued,in_progress,waiting_user,waiting_vendor,resolved,closed,rejected,cancelled',
            'note' => 'nullable|string',
        ]);

        $oldStatus = $ticket->status;

        // Record status history
        $ticket->statusHistory()->create([
            'from_status' => $oldStatus,
            'to_status' => $validated['status'],
            'changed_by' => $request->user()->id,
            'note' => $validated['note'] ?? null,
        ]);

        // Set resolved/closed timestamps
        if ($validated['status'] === 'resolved' && !$ticket->resolved_at) {
            $ticket->resolved_at = now();
        }
        if ($validated['status'] === 'closed' && !$ticket->closed_at) {
            $ticket->closed_at = now();
        }

        $ticket->update([
            'status' => $validated['status'],
            'is_draft' => in_array($validated['status'], ['new', 'triaged', 'waiting_approval'], true),
        ]);

        ConversationState::updateOrCreate(
            ['conversation_id' => $ticket->conversation_id],
            [
                'status' => $validated['status'],
                'needs_ticket' => true,
                'ticket_type' => $ticket->ticket_type,
                'approval_required' => $ticket->approval_required,
                'last_activity_at' => now(),
            ]
        );

        // Audit
        AuditService::log(
            'status_changed', 'ticket', $ticket->id,
            $request->user()->id,
            ['status' => $oldStatus],
            ['status' => $validated['status']]
        );

        // Notify reporter on status change
        if ($ticket->reported_by && $ticket->reported_by !== $request->user()->id) {
            Notification::create([
                'user_id' => $ticket->reported_by,
                'type' => 'ticket_status',
                'title' => "{$ticket->ticket_number} status changed",
                'body' => "\"{$ticket->title}\" → " . ucfirst(str_replace('_', ' ', $validated['status'])),
                'ticket_id' => $ticket->id,
            ]);
        }

        return response()->json(['data' => $ticket]);
    }

    /**
     * Assign ticket to user/team.
     */
    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'assigned_user_id' => 'nullable|exists:users,id',
            'assigned_team_id' => 'nullable|exists:divisions,id',
            'note' => 'nullable|string',
        ]);

        $oldAssignee = $ticket->assigned_user_id;
        $oldTeam = $ticket->assigned_team_id;

        $ticket->update([
            'assigned_user_id' => array_key_exists('assigned_user_id', $validated) ? $validated['assigned_user_id'] : $ticket->assigned_user_id,
            'assigned_team_id' => array_key_exists('assigned_team_id', $validated) ? $validated['assigned_team_id'] : $ticket->assigned_team_id,
            'status' => in_array($ticket->status, ['new', 'triaged'], true) ? 'queued' : $ticket->status,
        ]);

        ConversationState::updateOrCreate(
            ['conversation_id' => $ticket->conversation_id],
            [
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'category' => $ticket->category,
                'needs_ticket' => true,
                'ticket_type' => $ticket->ticket_type,
                'approval_required' => $ticket->approval_required,
                'assigned_team_id' => $ticket->assigned_team_id,
                'assigned_user_id' => $ticket->assigned_user_id,
                'last_activity_at' => now(),
            ]
        );

        // Record assignment (only if assigning to someone)
        $assignTo = array_key_exists('assigned_user_id', $validated) ? $validated['assigned_user_id'] : $ticket->assigned_user_id;
        if ($assignTo) {
            $ticket->assignments()->create([
                'assigned_by' => $request->user()->id,
                'assigned_to' => $assignTo,
                'team_id' => $validated['assigned_team_id'] ?? $ticket->assigned_team_id,
                'note' => $validated['note'] ?? null,
            ]);
        }

        AuditService::log(
            'assigned', 'ticket', $ticket->id,
            $request->user()->id,
            ['assigned_user_id' => $oldAssignee, 'assigned_team_id' => $oldTeam],
            ['assigned_user_id' => $ticket->assigned_user_id, 'assigned_team_id' => $ticket->assigned_team_id]
        );

        // Notify new assignee
        if ($ticket->assigned_user_id && $ticket->assigned_user_id !== $request->user()->id) {
            Notification::create([
                'user_id' => $ticket->assigned_user_id,
                'type' => 'ticket_assigned',
                'title' => "You've been assigned to {$ticket->ticket_number}",
                'body' => "\"{$ticket->title}\" — Priority: {$ticket->priority}",
                'ticket_id' => $ticket->id,
            ]);
        }

        $ticket->load(['assignments.assignedBy:id,name', 'assignments.assignedTo:id,name']);
        return response()->json(['data' => $ticket]);
    }

    /**
     * Update ticket fields.
     */
    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'ticket_type' => 'nullable|in:bugfix,development,maintenance',
            'category' => 'nullable|string',
            'priority' => 'nullable|in:P1,P2,P3,P4',
            'assigned_user_id' => 'nullable|exists:users,id',
            'assigned_team_id' => 'nullable|exists:divisions,id',
            'approval_required' => 'nullable|boolean',
            'tags' => 'nullable|array',
            'due_at' => 'nullable|date',
            'estimation' => 'nullable|string|max:50',
        ]);

        // If assigning a user, record assignment history
        if ($request->has('assigned_user_id') && $validated['assigned_user_id'] != $ticket->assigned_user_id) {
            $ticket->assignments()->create([
                'assigned_to' => $validated['assigned_user_id'],
                'assigned_by' => $request->user()->id,
                'team_id' => $validated['assigned_team_id'] ?? $ticket->assigned_team_id,
            ]);
        }

        // Log each field change as separate activity entry
        $fieldLabels = [
            'title' => 'set title', 'description' => 'updated description', 'ticket_type' => 'set type',
            'category' => 'set category', 'priority' => 'set priority',
            'approval_required' => 'set approval', 'tags' => 'set tags', 'due_at' => 'set due date', 'estimation' => 'set estimation',
        ];
        foreach ($validated as $field => $newValue) {
            if (!array_key_exists($field, $fieldLabels)) continue;
            $oldValue = $ticket->getOriginal($field);
            if ($oldValue != $newValue) {
                $newStr = is_array($newValue) ? json_encode($newValue) : ($newValue ?: 'none');
                $ticket->comments()->create([
                    'user_id' => $request->user()->id,
                    'body_text' => "{$fieldLabels[$field]} to {$newStr}",
                ]);
            }
        }

        $ticket->update($validated);
        $ticket->refresh()->load([
            'reporter:id,name,username,email',
            'assignedUser:id,name,username,email',
            'assignedTeam:id,name',
            'assignments.assignedTo:id,name',
            'assignments.assignedBy:id,name',
        ]);

        if ($ticket->conversation_id) {
            ConversationState::updateOrCreate(
                ['conversation_id' => $ticket->conversation_id],
                [
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'category' => $ticket->category,
                    'needs_ticket' => true,
                    'ticket_type' => $ticket->ticket_type,
                    'approval_required' => $ticket->approval_required,
                    'last_activity_at' => now(),
                ]
            );
        }

        return response()->json(['data' => $ticket]);
    }
}
