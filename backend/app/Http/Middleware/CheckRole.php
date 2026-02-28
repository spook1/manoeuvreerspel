<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Admin mag alles
        if ($request->user()->isAdmin()) {
            return $next($request);
        }

        // Check user role against allowed roles
        if (! in_array($request->user()->role, $roles)) {
            return response()->json(['message' => 'Forbidden: You need role ' . implode(' or ', $roles)], 403);
        }

        return $next($request);
    }
}
