<?php

namespace App\Http\Controllers\Api;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends \App\Http\Controllers\Controller
{
    /** Role hierarchy: higher index = higher rank */
    private const ROLE_RANK = [
        'guest' => 0, 'consultant' => 1, 'agent' => 2, 'staff' => 3,
        'supervisor' => 4, 'manager' => 5, 'admin' => 6, 'super_admin' => 7,
    ];

    /** Check if acting user can modify target user */
    private function canModifyUser(User $acting, User $target): void
    {
        $actingRank = 0;
        foreach ($acting->roles as $role) {
            $r = self::ROLE_RANK[$role->name] ?? 0;
            if ($r > $actingRank) $actingRank = $r;
        }

        $targetRank = 0;
        foreach ($target->roles as $role) {
            $r = self::ROLE_RANK[$role->name] ?? 0;
            if ($r > $targetRank) $targetRank = $r;
        }

        if ($targetRank > $actingRank) {
            abort(403, 'You cannot modify a user with a higher role than yours.');
        }
    }
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with(['roles:id,name,label', 'division:id,name'])
            ->where('is_active', true);

        if ($request->filled('q')) {
            $search = $request->string('q')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('username', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', fn($q) => $q->where('name', $request->string('role')->toString()));
        }

        $users = $query
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'username', 'division_id', 'is_active', 'avatar_url', 'created_at']);

        return response()->json(['data' => $users]);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'username' => 'nullable|string|max:50|unique:users',
            'phone' => 'nullable|string|max:20',
            'division_id' => 'nullable|exists:divisions,id',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'username' => $validated['username'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'division_id' => $validated['division_id'] ?? null,
            'is_active' => true,
        ]);

        if (!empty($validated['role_ids'])) {
            $user->roles()->sync($validated['role_ids']);
        }

        return response()->json([
            'data' => $user->load(['roles:id,name,label', 'division:id,name']),
        ], 201);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->canModifyUser($request->user(), $user);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'username' => ['nullable', 'string', 'max:50', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'division_id' => 'nullable|exists:divisions,id',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'data' => $user->load(['roles:id,name,label', 'division:id,name']),
        ]);
    }

    /**
     * Deactivate a user (soft delete).
     */
    public function destroy(User $user): JsonResponse
    {
        $this->canModifyUser(request()->user(), $user);
        $user->update(['is_active' => false]);
        return response()->json(['message' => 'User deactivated']);
    }

    /**
     * Assign roles to a user.
     */
    public function assignRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $user->roles()->sync($validated['role_ids']);

        return response()->json([
            'data' => $user->load(['roles:id,name,label']),
        ]);
    }

    /**
     * List available roles.
     */
    public function roles(): JsonResponse
    {
        return response()->json([
            'data' => Role::select('id', 'name', 'label')->get(),
        ]);
    }
}
