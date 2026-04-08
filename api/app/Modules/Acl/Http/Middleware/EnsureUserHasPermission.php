<?php

declare(strict_types=1);

namespace App\Modules\Acl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * @param  string  ...$permissionPipeList  Arguments may be single string "a|b|c" from route definition
     */
    public function handle(Request $request, Closure $next, string ...$permissionPipeList): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        $required = $this->flattenPermissionArguments($permissionPipeList);

        if ($required === []) {
            return $next($request);
        }

        if (! $user->hasAnyPermission($required)) {
            abort(403, 'Você não tem permissão para esta ação.');
        }

        return $next($request);
    }

    /**
     * @param  list<string>  $permissionPipeList
     * @return list<string>
     */
    private function flattenPermissionArguments(array $permissionPipeList): array
    {
        $flat = [];
        foreach ($permissionPipeList as $chunk) {
            foreach (explode('|', $chunk) as $part) {
                $t = trim($part);
                if ($t !== '') {
                    $flat[] = $t;
                }
            }
        }

        return array_values(array_unique($flat));
    }
}
