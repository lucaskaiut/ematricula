<?php

declare(strict_types=1);

namespace App\Modules\Acl\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Acl\Domain\Enums\Permission;
use Illuminate\Http\JsonResponse;

class AclPermissionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Permission::definitions(),
        ]);
    }
}
