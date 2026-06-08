<?php

namespace App\Http\Controllers\Api;

use App\Models\Division;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DivisionController extends \App\Http\Controllers\Controller
{
    public function index(): JsonResponse
    {
        $divisions = Division::with(['manager', 'members'])
            ->where('is_active', true)
            ->get();

        return response()->json(['data' => $divisions]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:divisions',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $division = Division::create($validated);

        return response()->json(['data' => $division], 201);
    }

    public function show(Division $division): JsonResponse
    {
        return response()->json([
            'data' => $division->load(['manager', 'members', 'tickets']),
        ]);
    }

    public function update(Request $request, Division $division): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
            'is_active' => 'sometimes|boolean',
        ]);

        $division->update($validated);

        return response()->json(['data' => $division]);
    }

    public function addMember(Request $request, Division $division): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $division->members()->syncWithoutDetaching([$validated['user_id']]);

        return response()->json([
            'message' => 'Member added',
            'data' => $division->load('members'),
        ]);
    }

    public function removeMember(Request $request, Division $division): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $division->members()->detach($validated['user_id']);

        return response()->json([
            'message' => 'Member removed',
            'data' => $division->load('members'),
        ]);
    }

    public function workload(Division $division): JsonResponse
    {
        $members = $division->members()
            ->withCount(['assignedTickets' => function ($q) {
                $q->whereNotIn('status', ['resolved', 'closed']);
            }])
            ->get();

        return response()->json(['data' => $members]);
    }
}