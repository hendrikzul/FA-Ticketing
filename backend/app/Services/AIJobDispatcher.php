<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class AIJobDispatcher
{
    /**
     * Dispatch an AI processing job to the Redis queue.
     * Worker picks this up and processes via AI Orchestrator.
     */
    public static function dispatch(int $conversationId, int $messageId, string $bodyText, int $senderId, ?int $parentId = null, string $jobType = 'process_message'): void
    {
        $job = json_encode([
            'job_type' => $jobType,
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
            'body_text' => $bodyText,
            'sender_id' => $senderId,
            'parent_id' => $parentId,
        ]);

        Redis::rpush('aicop:ai_jobs', $job);

        Log::info("AI job dispatched", [
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
        ]);
    }

    /**
     * Dispatch a summary generation job.
     */
    public static function dispatchSummary(int $conversationId, array $messages): void
    {
        $job = json_encode([
            'job_type' => 'generate_summary',
            'conversation_id' => $conversationId,
            'conversation_context' => ['messages' => $messages],
        ]);

        Redis::rpush('aicop:ai_jobs', $job);
    }

    /**
     * Dispatch a ticket extraction job.
     */
    public static function dispatchTicketExtraction(int $conversationId, int $messageId, string $bodyText): void
    {
        $job = json_encode([
            'job_type' => 'extract_ticket',
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
            'body_text' => $bodyText,
        ]);

        Redis::rpush('aicop:ai_jobs', $job);
    }

    /**
     * Dispatch suggested actions job.
     */
    public static function dispatchSuggestActions(int $conversationId, array $state): void
    {
        $job = json_encode([
            'job_type' => 'suggest_actions',
            'conversation_id' => $conversationId,
            'conversation_context' => ['state' => $state],
        ]);

        Redis::rpush('aicop:ai_jobs', $job);
    }

    /**
     * Check if AI result is ready.
     */
    public static function getResult(int $conversationId, int $messageId): ?array
    {
        $key = "aicop:ai_results:{$conversationId}:{$messageId}";
        $result = Redis::get($key);

        if ($result) {
            return json_decode($result, true);
        }

        return null;
    }
}