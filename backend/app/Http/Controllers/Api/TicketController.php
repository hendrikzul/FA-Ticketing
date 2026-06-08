<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends \App\Http\Controllers\Controller
{
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
            $kanbanColumns = ['new', 'triaged', 'assigned', 'working', 'waiting_user', 'waiting_vendor', 'resolved', 'closed'];
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
            'conversation.messages' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20),
        ]);

        return response()->json(['data' => $ticket]);
    }

    /**
     * Update ticket status (for Kanban drag-and-drop).
     */
    public function updateStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:new,triaged,assigned,working,waiting_user,waiting_vendor,resolved,closed',
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

        $ticket->update(['status' => $validated['status']]);

        // Audit
        AuditService::log(
            'status_changed', 'ticket', $ticket->id,
            $request->user()->id,
            ['status' => $oldStatus],
            ['status' => $validated['status']]
        );

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
            'assigned_user_id' => $validated['assigned_user_id'] ?? $ticket->assigned_user_id,
            'assigned_team_id' => $validated['assigned_team_id'] ?? $ticket->assigned_team_id,
            'status' => $ticket->status === 'new' ? 'assigned' : $ticket->status,
        ]);

        // Record assignment
        $ticket->assignments()->create([
            'assigned_by' => $request->user()->id,
            'assigned_to' => $validated['assigned_user_id'] ?? $ticket->assigned_user_id,
            'team_id' => $validated['assigned_team_id'] ?? $ticket->assigned_team_id,
            'note' => $validated['note'] ?? null,
        ]);

        AuditService::log(
            'assigned', 'ticket', $ticket->id,
            $request->user()->id,
            ['assigned_user_id' => $oldAssignee, 'assigned_team_id' => $oldTeam],
            ['assigned_user_id' => $ticket->assigned_user_id, 'assigned_team_id' => $ticket->assigned_team_id]
        );

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
            'category' => 'nullable|string',
            'priority' => 'nullable|in:P1,P2,P3,P4',
            'tags' => 'nullable|array',
            'due_at' => 'nullable|date',
        ]);

        $ticket->update($validated);

        return response()->json(['data' => $ticket]);
    }
}