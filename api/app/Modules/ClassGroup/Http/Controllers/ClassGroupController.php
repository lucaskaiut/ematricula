<?php

declare(strict_types=1);

namespace App\Modules\ClassGroup\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ClassGroup\Domain\Services\ClassGroupService;
use App\Modules\ClassGroup\Http\Requests\ClassGroupRequest;
use App\Modules\ClassGroup\Http\Resources\ClassGroupResource;
use App\Modules\Core\Http\Traits\ControllerTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassGroupController extends Controller
{
    use ControllerTrait;

    protected string $service = ClassGroupService::class;

    protected string $resource = ClassGroupResource::class;

    protected string $request = ClassGroupRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: ['modality', 'teacher', 'creator', 'updater', 'plans'],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail(
            $id,
            ['*'],
            ['modality', 'teacher', 'creator', 'updater', 'plans']
        );

        return $this->respondWithItem($model);
    }
}
