<?php

namespace App\Http\Controllers\Api;

use App\Models\AuditLog;
use App\Models\Conversation;
use App\Models\ConversationState;
use App\Models\Mention;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends \App\Http\Controllers\Controller
{
    /**
     * List conversations accessible by user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filter = $request->get('filter', 'all'); // all, inbox, mentioned, assigned, watching
        $mode = $request->get('mode');

        $query = Conversation::query()
            ->with(['creator:id,name,username', 'state', 'participants:id,name'])
            ->withCount('messages');

        if (in_array($mode, ['human', 'ai', 'direct', 'group'], true)) {
            $query->where('conversation_mode', $mode);
        }

        switch ($filter) {
            case 'inbox':
                $query->whereHas('participants', fn($q) => $q->where('user_id', $user->id));
                break;
            case 'mentioned':
                $query->whereHas('messages.mentions', fn($q) => $q->where('user_id', $user->id));
                break;
            case 'watching':
                $query->whereHas('watchers', fn($q) => $q->where('user_id', $user->id)->where('is_active', true));
                break;
            case 'assigned':
                $query->whereHas('ticket', fn($q) => $q->where('assigned_user_id', $user->id));
                break;
            case 'all':
            default:
                // Return all non-private + own private
                $query->where(function ($q) use ($user) {
                    $q->where('is_private', false)
                      ->orWhere('created_by', $user->id)
                      ->orWhereHas('participants', fn($p) => $p->where('user_id', $user->id));
                });
                break;
        }

        // Fulltext search if query provided
        if ($request->has('q')) {
            $search = $request->get('q');
            $query->where('title', 'ilike', "%{$search}%");
        }

        $conversations = $query->orderBy('last_activity_at', 'desc')
            ->orderBy('updated_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json($conversations);
    }

    /**
     * Create a new conversation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'is_private' => 'sometimes|boolean',
            'message' => 'required|string',
            'conversation_mode' => 'nullable|in:human,ai,direct,group',
            'participant_ids' => 'nullable|array',
            'participant_ids.*' => 'exists:users,id',
        ]);

        $conversationMode = $validated['conversation_mode'] ?? 'ai';
        $participantIds = collect($validated['participant_ids'] ?? [])
            ->map(fn($id) => (int) $id)
            ->filter(fn($id) => $id !== $request->user()->id)
            ->unique()
            ->values();

        if ($conversationMode === 'human' && $participantIds->isEmpty()) {
            return response()->json([
                'message' => 'Human chat requires at least one recipient.',
                'errors' => ['participant_ids' => ['Select at least one recipient for human chat.']],
            ], 422);
        }

        $title = $validated['title'] ?? 'New Conversation';
        $isPrivate = $validated['is_private'] ?? ($conversationMode === 'human');

        if ($conversationMode === 'human' && $participantIds->count() === 1 && empty($validated['title'])) {
            $recipient = User::find($participantIds->first());
            if ($recipient) {
                $title = $recipient->name;
            }
        }

        $conversation = Conversation::create([
            'title' => $title,
            'created_by' => $request->user()->id,
            'status' => 'active',
            'conversation_mode' => $conversationMode,
            'is_private' => $isPrivate,
            'last_activity_at' => now(),
        ]);

        // Add creator as participant
        $conversation->participants()->attach($request->user()->id, [
            'role' => 'owner',
        ]);

        foreach ($participantIds as $participantId) {
            $conversation->participants()->syncWithoutDetaching([
                $participantId => ['role' => 'participant'],
            ]);
        }

        // Create initial message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'user',
            'sender_id' => $request->user()->id,
            'message_type' => 'text',
            'body_text' => $validated['message'],
        ]);

        // Create conversation state
        ConversationState::create([
            'conversation_id' => $conversation->id,
            'object_type' => $conversationMode === 'ai' ? 'intake' : 'chat',
            'last_activity_at' => now(),
        ]);

        return response()->json([
            'data' => $conversation->load(['creator', 'messages']),
        ], 201);
    }

    /**
     * Show conversation detail with messages.
     */
    public function show(Conversation $conversation, Request $request): JsonResponse
    {
        $this->authorizeConversation($request->user(), $conversation);

        // Mark as read for this participant
        $conversation->participants()->updateExistingPivot($request->user()->id, [
            'last_read_at' => now(),
        ]);

        $conversation->load([
            'creator:id,name,username',
            'participants:id,name,username,email',
            'watchers:id,name,username',
            'state',
            'ticket:tickets.id,tickets.conversation_id,tickets.ticket_number,tickets.title,tickets.ticket_type,tickets.category,tickets.priority,tickets.status,tickets.is_draft,tickets.approval_required,tickets.assigned_team_id,tickets.assigned_user_id,tickets.due_at',
            'ticket.assignedUser:id,name',
            'ticket.assignedTeam:id,name',
            'messages' => fn($q) => $q->orderBy('created_at', 'asc')->limit(50),
            'messages.mentions.user:id,name,username',
            'aiSummaries' => fn($q) => $q->latest()->limit(5),
        ]);

        return response()->json(['data' => $conversation]);
    }

    /**
     * Add participant to conversation.
     */
    public function addParticipant(Conversation $conversation, Request $request): JsonResponse
    {
        $this->authorizeConversationManagement($request->user(), $conversation);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'nullable|in:owner,participant',
        ]);

        $conversation->participants()->syncWithoutDetaching([
            $validated['user_id'] => ['role' => $validated['role'] ?? 'participant'],
        ]);

        return response()->json(['message' => 'Participant added']);
    }

    /**
     * Add watcher to conversation.
     */
    public function addWatcher(Conversation $conversation, Request $request): JsonResponse
    {
        $this->authorizeConversationManagement($request->user(), $conversation);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $conversation->watchers()->syncWithoutDetaching([
            $validated['user_id'] => ['is_active' => true],
        ]);

        return response()->json(['message' => 'Watcher added']);
    }

    /**
     * Remove watcher from conversation.
     */
    public function removeWatcher(Conversation $conversation, Request $request): JsonResponse
    {
        $this->authorizeConversationManagement($request->user(), $conversation);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $conversation->watchers()->detach($validated['user_id']);

        return response()->json(['message' => 'Watcher removed']);
    }

    /**
     * Authorize user can access conversation.
     */
    private function authorizeConversation(User $user, Conversation $conversation): void
    {
        if ($conversation->is_private && !$this->canObserveConversation($user, $conversation)) {
            abort(403, 'You do not have access to this conversation.');
        }
    }

    private function authorizeConversationManagement(User $user, Conversation $conversation): void
    {
        if ($conversation->created_by === $user->id) {
            return;
        }

        $isOwner = $conversation->participants()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'owner')
            ->exists();

        if (!$isOwner) {
            abort(403, 'You do not have permission to manage this conversation.');
        }
    }

    private function canObserveConversation(User $user, Conversation $conversation): bool
    {
        if ($conversation->created_by === $user->id) {
            return true;
        }

        if ($conversation->participants()->where('user_id', $user->id)->exists()) {
            return true;
        }

        return $conversation->watchers()
            ->where('user_id', $user->id)
            ->wherePivot('is_active', true)
            ->exists();
    }
}
