<?php

namespace App\Http\Controllers\Api;

use App\Models\Conversation;
use App\Models\Mention;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Send a message to a conversation.
     */
    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $validated = $request->validate([
            'body_text' => 'required_without:body_json|string',
            'body_json' => 'nullable|json',
            'message_type' => 'nullable|in:text,file,image,action,event',
            'file' => 'nullable|file|max:10240', // 10MB
        ]);

        $message = new Message([
            'conversation_id' => $conversation->id,
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

        // Handle file attachment
        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('attachments');
            $message->attachments()->create([
                'conversation_id' => $conversation->id,
                'filename' => $request->file('file')->getClientOriginalName(),
                'mime_type' => $request->file('file')->getMimeType(),
                'size_bytes' => $request->file('file')->getSize(),
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

        $message->load(['mentions.user:id,name,username']);

        return response()->json(['data' => $message], 201);
    }

    /**
     * List messages for a conversation (paginated).
     */
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $messages = $conversation->messages()
            ->with(['mentions.user:id,name,username', 'attachments'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 50));

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
}