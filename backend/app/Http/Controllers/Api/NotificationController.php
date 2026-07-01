<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends \App\Http\Controllers\Controller
{
    /**
     * List notifications for authenticated user (latest 50, unread first).
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('is_read', 'asc')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['data' => $notifications]);
    }

    /**
     * Get unread count for the bell badge.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a notification as read.
     */
    public function markRead(Notification $notification): JsonResponse
    {
        $notification->update(['is_read' => true]);
        return response()->json(['data' => $notification]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All marked as read']);
    }
}
