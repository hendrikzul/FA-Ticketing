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

        $query = Conversation::query()
            ->with(['creator:id,name,username', 'state'])
            ->withCount('messages');

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
        ]);

        $conversation = Conversation::create([
            'title' => $validated['title'] ?? 'New Conversation',
            'created_by' => $request->user()->id,
            'status' => 'active',
            'is_private' => $validated['is_private'] ?? false,
            'last_activity_at' => now(),
        ]);

        // Add creator as participant
        $conversation->participants()->attach($request->user()->id, [
            'role' => 'owner',
        ]);

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
            'messages' => fn($q) => $q->orderBy('created_at', 'desc')->limit(50),
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
        if ($conversation->is_private) {
            $isParticipant = $conversation->participants()
                ->where('user_id', $user->id)
                ->exists();

            if (!$isParticipant && $conversation->created_by !== $user->id) {
                abort(403, 'You do not have access to this conversation.');
            }
        }
    }
}