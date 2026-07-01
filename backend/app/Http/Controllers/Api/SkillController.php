<?php

namespace App\Http\Controllers\Api;

use App\Models\AiSkill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SkillController extends \App\Http\Controllers\Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AiSkill::query()
            ->with(['creator:id,name'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('scope')) {
            $query->where('scope', $request->string('scope')->toString());
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:ai_skills',
            'display_name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'github_url' => 'nullable|url|max:500',
            'entrypoint' => 'nullable|string|max:200',
            'scope' => 'nullable|in:global,user',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $skill = AiSkill::create(array_merge($validated, [
            'created_by' => $request->user()->id,
        ]));

        return response()->json(['data' => $skill->load('creator:id,name')], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $skill = AiSkill::findOrFail($id);

        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'github_url' => 'nullable|url|max:500',
            'entrypoint' => 'nullable|string|max:200',
            'is_active' => 'sometimes|boolean',
        ]);

        $skill->update($validated);
        return response()->json(['data' => $skill]);
    }

    public function destroy(string $id): JsonResponse
    {
        $skill = AiSkill::findOrFail($id);
        $skill->delete();
        return response()->json(['message' => 'Skill deleted']);
    }

    public function toggle(string $id): JsonResponse
    {
        $skill = AiSkill::findOrFail($id);
        $skill->update(['is_active' => !$skill->is_active]);
        return response()->json(['data' => $skill]);
    }
}
