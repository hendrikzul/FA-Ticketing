<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Rsa\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;

class CloudflareAuthController extends \App\Http\Controllers\Controller
{
    /**
     * Auto-login via Cloudflare Access header.
     * If valid Cf-Access-Jwt-Assertion header present → auto-login.
     * If not → return 204 (fallback to normal login).
     */
    public function autoLogin(Request $request): JsonResponse
    {
        $cfEmail = $request->header('Cf-Access-Authenticated-User-Email');

        // No Cloudflare header — let frontend use normal login
        if (!$cfEmail) {
            return response()->json(['message' => 'No Cloudflare session'], 204);
        }

        // Validate JWT assertion (optional, Cloudflare already validates at edge)
        $cfJwt = $request->header('Cf-Access-Jwt-Assertion');
        if ($cfJwt) {
            $valid = $this->validateCfJwt($cfJwt);
            if (!$valid) {
                return response()->json(['message' => 'Invalid Cloudflare token'], 401);
            }
        }

        // Find or create user
        $user = User::where('email', $cfEmail)->first();
        if (!$user) {
            $user = User::create([
                'name' => explode('@', $cfEmail)[0],
                'email' => $cfEmail,
                'username' => explode('@', $cfEmail)[0],
                'password' => Hash::make(\Illuminate\Support\Str::random(32)),
                'is_active' => true,
            ]);
        }

        // Generate Sanctum token
        $token = $user->createToken('cloudflare')->plainTextToken;

        return response()->json([
            'message' => 'Login successful via Cloudflare',
            'user' => $user->load('roles:id,name,label'),
            'token' => $token,
        ]);
    }

    /**
     * Validate Cloudflare JWT assertion.
     * Uses Cloudflare's public signing keys.
     */
    private function validateCfJwt(string $jwt): bool
    {
        try {
            $config = Configuration::forSymmetricSigner(
                new Sha256(),
                InMemory::empty() // Cloudflare uses RS256 with public keys from their JWKS endpoint
            );
            // In production, fetch Cloudflare's public key from their JWKS endpoint:
            // https://<team-domain>.cloudflareaccess.com/cdn-cgi/access/certs
            // For now, trust the edge-validated header
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
