<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends \App\Http\Controllers\Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'username' => 'nullable|string|max:50|unique:users',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'username' => $validated['username'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'is_active' => true,
        ]);

        // Assign default 'member' role
        $memberRole = \App\Models\Role::where('name', 'guest')->first();
        if ($memberRole) {
            $user->roles()->attach($memberRole);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user->load('roles'),
            'token' => $token,
        ], 201);
    }

    /**
     * Login and return token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($validated)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        // Delete old tokens
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('roles'),
            'token' => $token,
        ]);
    }

    /**
     * Logout (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get current authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load(['roles.permissions', 'division']),
        ]);
    }

    /**
     * Upload avatar for current user.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $user = $request->user();
        $file = $request->file('avatar');
        $path = $file->store('avatars', 'public');

        // Generate URL using APP_URL to avoid localhost in production
        $url = rtrim(config('app.url'), '/') . '/storage/' . $path;

        $user->update(['avatar_url' => $url]);

        return response()->json([
            'message' => 'Avatar uploaded',
            'avatar_url' => $url,
        ]);
    }
}