<?php

declare(strict_types=1);

namespace App\Modules\Modality\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\Modality\Domain\Services\ModalityService;
use App\Modules\Modality\Http\Requests\ModalityRequest;
use App\Modules\Modality\Http\Resources\ModalityResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModalityController extends Controller
{
    use ControllerTrait;

    protected string $service = ModalityService::class;

    protected string $resource = ModalityResource::class;

    protected string $request = ModalityRequest::class;

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
        $model = $this->service()->findOrFail($id, ['*'], ['creator', 'updater']);

        return $this->respondWithItem($model);
    }
}
