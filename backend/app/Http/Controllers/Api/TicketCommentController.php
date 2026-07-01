<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use App\Models\User;
use App\Models\Notification;
use App\Models\Mention;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketCommentController extends \App\Http\Controllers\Controller
{
    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'body_text' => 'nullable|string|max:5000',
            'file' => 'nullable|file|max:20480|mimetypes:text/plain,text/csv,text/html,text/x-script.python,text/x-python,text/javascript,application/json,application/xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime',
        ]);

        $data = [
            'user_id' => $request->user()->id,
            'body_text' => $validated['body_text'] ?? '',
        ];

        // Handle file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $cleanName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
            // Store directly using Laravel's file helper to avoid temp file issues
            $file->storeAs('ticket-comments', $cleanName, ['disk' => 'public']);
            $data['attachment_path'] = 'ticket-comments/' . $cleanName;
            $data['attachment_name'] = $file->getClientOriginalName();
            $data['mime_type'] = $file->getMimeType();
        }

        $comment = $ticket->comments()->create($data);
        $comment->load('user:id,name,username,avatar_url');

        // Parse @mentions and notify users
        if (!empty($comment->body_text)) {
            preg_match_all('/@([\w\s]+?)(?=\s*$|\s*[@\n\r]|$)/', $comment->body_text, $matches);
            $mentionedNames = array_unique(array_map('trim', $matches[1] ?? []));
            $mentionedUsers = collect();
            foreach ($mentionedNames as $name) {
                $u = User::where('name', 'ilike', $name)->where('id', '!=', $comment->user_id)->first();
                if ($u) $mentionedUsers->push($u);
            }

            foreach ($mentionedUsers as $mentioned) {
                // Create mention record
                Mention::create([
                    'message_id' => null,
                    'comment_id' => $comment->id,
                    'user_id' => $mentioned->id,
                ]);

                // Create in-app notification
                Notification::create([
                    'user_id' => $mentioned->id,
                    'type' => 'ticket_mention',
                    'title' => "{$comment->user->name} mentioned you in {$ticket->ticket_number}",
                    'body' => "\"{$ticket->title}\" — " . \Illuminate\Support\Str::limit($comment->body_text, 100),
                    'ticket_id' => $ticket->id,
                ]);
            }
        }

        return response()->json(['data' => $comment], 201);
    }
}
