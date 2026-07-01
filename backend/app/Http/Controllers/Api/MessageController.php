<?php

namespace App\Http\Controllers\Api;

use App\Models\Conversation;
use App\Models\Mention;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends \App\Http\Controllers\Controller
{
    /**
     * Send a message to a conversation.
     */
    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversationPosting($request->user(), $conversation);

        $validated = $request->validate([
            'body_text' => 'required_without_all:body_json,files|string|nullable',
            'body_json' => 'nullable|json',
            'message_type' => 'nullable|in:text,file,image,action,event',
            'parent_id' => 'nullable|exists:messages,id',
            'file' => 'nullable|file|max:10240',
            'files' => 'nullable|array',
            'files.*' => 'file|max:10240',
        ]);

        $message = new Message([
            'conversation_id' => $conversation->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'sender_type' => 'user',
            'sender_id' => $request->user()->id,
            'message_type' => $validated['message_type'] ?? 'text',
            'body_text' => $validated['body_text'] ?? null,
            'body_json' => $validated['body_json'] ?? null,
        ]);

        // Extract mentions from body_text (@username pattern)
        $mentionIds = $this->extractMentions($validated['body_text'] ?? '');

        $message->save();

        // Create mention records
        foreach ($mentionIds as $userId) {
            Mention::create([
                'message_id' => $message->id,
                'user_id' => $userId,
            ]);
        }

        // Handle file attachments (single + multi)
        $files = [];
        if ($request->hasFile('file')) {
            $files[] = $request->file('file');
        }
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $uploadedFile) {
                $files[] = $uploadedFile;
            }
        }

        foreach ($files as $uploadedFile) {
            $path = $uploadedFile->store('attachments');
            $message->attachments()->create([
                'conversation_id' => $conversation->id,
                'filename' => $uploadedFile->getClientOriginalName(),
                'mime_type' => $uploadedFile->getMimeType(),
                'size_bytes' => $uploadedFile->getSize(),
                'storage_path' => $path,
                'uploaded_by' => $request->user()->id,
            ]);
        }

        // Update conversation timestamp
        $conversation->update(['last_activity_at' => now()]);

        // Update conversation state
        $conversation->state()->updateOrCreate(
            ['conversation_id' => $conversation->id],
            ['last_activity_at' => now()]
        );

        $message->load(['sender:id,name,username,avatar_url', 'mentions.user:id,name,username', 'attachments']);

        // @ai mention OR AI mode: dispatch to worker via Redis (async)
        $isAiMention = str_contains($validated['body_text'] ?? '', '@ai');
        if ($isAiMention || $conversation->conversation_mode === 'ai') {
            try {
                \App\Services\AIJobDispatcher::dispatch(
                    $conversation->id,
                    $message->id,
                    $validated['body_text'],
                    $request->user()->id,
                    $validated['parent_id'] ?? null,
                    $isAiMention ? 'process_ai_mention' : 'process_message'
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("AI dispatch failed: " . $e->getMessage());
            }
        }

        return response()->json(['data' => $message], 201);
    }

    /**
     * List messages for a conversation.
     * Supports: top_level (only parent messages) and parent_id (thread replies).
     */
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversationRead($request->user(), $conversation);

        $query = $conversation->messages()
            ->with(['sender:id,name,username,avatar_url', 'mentions.user:id,name,username', 'attachments'])
            ->orderBy('created_at', 'asc');

        // Filter: only top-level messages (no parent)
        if ($request->boolean('top_level')) {
            $query->whereNull('parent_id');
        }

        // Filter: replies in a specific thread
        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->get('parent_id'));
        }

        $messages = $query->paginate($request->get('per_page', 50));

        // Mark conversation as read for participant
        $conversation->participants()->updateExistingPivot($request->user()->id, [
            'last_read_at' => now(),
        ]);

        return response()->json($messages);
    }

    /**
     * Extract user IDs from @username patterns in text.
     */
    private function extractMentions(string $text): array
    {
        preg_match_all('/@(\w+)/', $text, $matches);

        if (empty($matches[1])) {
            return [];
        }

        return \App\Models\User::whereIn('username', $matches[1])
            ->orWhereIn('name', $matches[1])
            ->pluck('id')
            ->toArray();
    }

    private function authorizeConversationRead(User $user, Conversation $conversation): void
    {
        if ($conversation->is_private && !$this->isConversationObserver($user, $conversation)) {
            abort(403, 'You do not have access to this conversation.');
        }
    }

    private function authorizeConversationPosting(User $user, Conversation $conversation): void
    {
        if (!$this->isConversationParticipant($user, $conversation)) {
            abort(403, 'You do not have permission to post in this conversation.');
        }
    }

    private function isConversationObserver(User $user, Conversation $conversation): bool
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

    private function isConversationParticipant(User $user, Conversation $conversation): bool
    {
        if ($conversation->created_by === $user->id) {
            return true;
        }

        return $conversation->participants()
            ->where('user_id', $user->id)
            ->exists();
    }
}
