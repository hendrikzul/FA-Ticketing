<?php

namespace App\Http\Controllers\Api;

use App\Models\CrossDivisionAccess;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccessMatrixController extends \App\Http\Controllers\Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CrossDivisionAccess::query()
            ->with(['user:id,name,email', 'division:id,name', 'grantor:id,name']);

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }
        if ($request->filled('division_id')) {
            $query->where('division_id', $request->integer('division_id'));
        }
        if ($request->filled('module')) {
            $query->where('module', $request->string('module')->toString());
        }

        return response()->json([
            'data' => $query->orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'division_id' => 'required|exists:divisions,id',
            'module' => 'required|string|max:50',
            'access_level' => 'required|in:view,edit,manage',
        ]);

        $grant = CrossDivisionAccess::create([
            'user_id' => $validated['user_id'],
            'division_id' => $validated['division_id'],
            'module' => $validated['module'],
            'access_level' => $validated['access_level'],
            'granted_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $grant->load(['user:id,name,email', 'division:id,name'])], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $grant = CrossDivisionAccess::findOrFail($id);

        $validated = $request->validate([
            'access_level' => 'required|in:view,edit,manage',
        ]);

        $grant->update($validated);

        return response()->json(['data' => $grant]);
    }

    public function destroy(string $id): JsonResponse
    {
        $grant = CrossDivisionAccess::findOrFail($id);
        $grant->delete();

        return response()->json(['message' => 'Access revoked']);
    }
}
