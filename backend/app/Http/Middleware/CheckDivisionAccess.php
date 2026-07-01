<?php

namespace App\Http\Middleware;

use App\Models\CrossDivisionAccess;
use Closure;
use Illuminate\Http\Request;

class CheckDivisionAccess
{
    /**
     * Check if user can access a resource in the given division/module.
     * Usage: Route::middleware('division.access:tickets,read')
     */
    public function handle(Request $request, Closure $next, string $module = '*', string $requiredLevel = 'view')
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        // 1. Super admin? Full access
        if ($user->roles()->where('name', 'super_admin')->exists()) {
            return $next($request);
        }

        $divisionId = $request->route('division')?->id
            ?? $request->input('division_id')
            ?? null;

        if (!$divisionId) {
            // No division context — allow (access check deferred)
            return $next($request);
        }

        // 2. Own division? Full access
        if ((int) $user->division_id === (int) $divisionId) {
            return $next($request);
        }

        // 3. Cross-division grant
        $grant = CrossDivisionAccess::where('user_id', $user->id)
            ->where('division_id', $divisionId)
            ->where(function ($q) use ($module) {
                $q->where('module', $module)->orWhere('module', '*');
            })
            ->first();

        if (!$grant) {
            abort(403, 'You do not have access to this division.');
        }

        // 4. Check access level: view < edit < manage
        $levels = ['view' => 1, 'edit' => 2, 'manage' => 3];
        if ($levels[$grant->access_level] < $levels[$requiredLevel]) {
            abort(403, "You only have {$grant->access_level} access to this module.");
        }

        return $next($request);
    }
}
