<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends \App\Http\Controllers\Controller
{
    /**
     * AI-interpreted search across conversations, tickets, knowledge base.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        $filters = $request->get('filters', []);

        if (empty($query)) {
            return response()->json(['data' => []]);
        }

        $results = [];

        // Search conversations
        $conversationResults = \App\Models\Conversation::query()
            ->where('title', 'ilike', "%{$query}%")
            ->orWhereHas('messages', fn($q) => $q->where('body_text', 'ilike', "%{$query}%"))
            ->orWhereHas('state', fn($q) => $q->where('current_summary', 'ilike', "%{$query}%"))
            ->with(['creator:id,name', 'state'])
            ->limit(10)
            ->get()
            ->map(fn($c) => [
                'type' => 'conversation',
                'id' => $c->id,
                'title' => $c->title,
                'status' => $c->status,
                'summary' => $c->state->first()?->current_summary,
            ]);
        $results = array_merge($results, $conversationResults->toArray());

        // Search tickets
        $ticketResults = Ticket::query()
            ->where('title', 'ilike', "%{$query}%")
            ->orWhere('description', 'ilike', "%{$query}%")
            ->orWhere('ticket_number', 'ilike', "%{$query}%")
            ->with(['assignedUser:id,name', 'reporter:id,name'])
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'type' => 'ticket',
                'id' => $t->id,
                'title' => $t->title,
                'number' => $t->ticket_number,
                'priority' => $t->priority,
                'status' => $t->status,
            ]);
        $results = array_merge($results, $ticketResults->toArray());

        // Search knowledge articles
        $kbResults = \App\Models\KnowledgeArticle::query()
            ->where('title', 'ilike', "%{$query}%")
            ->orWhere('symptoms', 'ilike', "%{$query}%")
            ->orWhere('resolution', 'ilike', "%{$query}%")
            ->where('status', 'published')
            ->limit(5)
            ->get()
            ->map(fn($k) => [
                'type' => 'knowledge',
                'id' => $k->id,
                'title' => $k->title,
                'status' => $k->status,
            ]);
        $results = array_merge($results, $kbResults->toArray());

        return response()->json(['data' => $results, 'query' => $query]);
    }
}
