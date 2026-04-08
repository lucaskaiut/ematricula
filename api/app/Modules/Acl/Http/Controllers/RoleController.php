<?php

declare(strict_types=1);

namespace App\Modules\Acl\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Acl\Domain\Services\RoleService;
use App\Modules\Acl\Http\Requests\RoleRequest;
use App\Modules\Acl\Http\Resources\RoleResource;
use App\Modules\Core\Http\Traits\ControllerTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    use ControllerTrait;

    protected string $service = RoleService::class;

    protected string $resource = RoleResource::class;

    protected string $request = RoleRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: [],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail($id);

        return $this->respondWithItem($model);
    }

    public function destroy(int|string $id): JsonResponse
    {
        try {
            DB::transaction(fn () => $this->service()->delete($id));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(null, 204);
    }
}
