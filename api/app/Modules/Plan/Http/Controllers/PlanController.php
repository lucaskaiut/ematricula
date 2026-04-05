<?php

declare(strict_types=1);

namespace App\Modules\Plan\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\Plan\Domain\Services\PlanService;
use App\Modules\Plan\Http\Requests\PlanRequest;
use App\Modules\Plan\Http\Resources\PlanResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    use ControllerTrait;

    protected string $service = PlanService::class;

    protected string $resource = PlanResource::class;

    protected string $request = PlanRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: ['creator', 'updater'],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail($id, ['*'], ['creator', 'updater']);

        return $this->respondWithItem($model);
    }
}
