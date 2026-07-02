<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class SocialiteController extends \App\Http\Controllers\Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirect(string $provider): JsonResponse
    {
        $url = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();
        return response()->json(['url' => $url]);
    }

    /**
     * Handle OAuth callback.
     */
    public function callback(string $provider): JsonResponse
    {
        try {
            $oauthUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return response()->json(['message' => 'OAuth login failed.'], 401);
        }

        $email = $oauthUser->getEmail();
        if (!$email) {
            return response()->json(['message' => 'Email not provided by OAuth provider.'], 400);
        }

        // Find or create user
        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'name' => $oauthUser->getName() ?? explode('@', $email)[0],
                'email' => $email,
                'username' => explode('@', $email)[0],
                'password' => Hash::make(\Illuminate\Support\Str::random(32)),
                'avatar_url' => $oauthUser->getAvatar(),
                'is_active' => true,
            ]);
        } else {
            // Update avatar on each login
            $user->update(['avatar_url' => $oauthUser->getAvatar()]);
        }

        // Generate Sanctum token
        $token = $user->createToken('oauth')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('roles:id,name,label'),
            'token' => $token,
        ]);
    }
}
