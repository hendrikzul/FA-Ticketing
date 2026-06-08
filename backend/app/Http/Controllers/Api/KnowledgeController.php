<?php

namespace App\Http\Controllers\Api;

use App\Models\KnowledgeArticle;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeController extends \App\Http\Controllers\Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = KnowledgeArticle::query()
            ->with(['author:id,name'])
            ->where('status', '!=', 'archived');

        if ($request->has('q')) {
            $search = $request->get('q');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('symptoms', 'ilike', "%{$search}%")
                  ->orWhere('resolution', 'ilike', "%{$search}%");
            });
        }

        $articles = $query->orderBy('published_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($articles);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'symptoms' => 'nullable|string',
            'root_cause' => 'nullable|string',
            'resolution' => 'nullable|string',
            'prevention' => 'nullable|string',
            'related_ticket_ids' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        $article = KnowledgeArticle::create([
            ...$validated,
            'author_id' => $request->user()->id,
            'status' => 'draft',
        ]);

        return response()->json(['data' => $article], 201);
    }

    public function show(KnowledgeArticle $article): JsonResponse
    {
        return response()->json([
            'data' => $article->load(['author:id,name', 'approvedBy:id,name']),
        ]);
    }

    public function update(Request $request, KnowledgeArticle $article): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'symptoms' => 'nullable|string',
            'root_cause' => 'nullable|string',
            'resolution' => 'nullable|string',
            'prevention' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $article->update($validated);

        return response()->json(['data' => $article]);
    }

    public function publish(KnowledgeArticle $article, Request $request): JsonResponse
    {
        $article->update([
            'status' => 'published',
            'approved_by' => $request->user()->id,
            'published_at' => now(),
        ]);

        return response()->json(['data' => $article]);
    }

    /**
     * Generate a knowledge draft from a resolved ticket.
     */
    public function generateFromTicket(Ticket $ticket, Request $request): JsonResponse
    {
        // Create KB draft from ticket resolution
        $article = KnowledgeArticle::create([
            'title' => "KB: {$ticket->title}",
            'symptoms' => $ticket->description,
            'root_cause' => null,
            'resolution' => 'Pending AI-generated resolution from conversation.',
            'prevention' => null,
            'related_ticket_ids' => [$ticket->id],
            'author_id' => $request->user()->id,
            'status' => 'draft',
        ]);

        return response()->json([
            'message' => 'Knowledge draft created from ticket',
            'data' => $article,
        ], 201);
    }
}
