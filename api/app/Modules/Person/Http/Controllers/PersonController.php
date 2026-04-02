<?php

declare(strict_types=1);

namespace App\Modules\Person\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\Person\Domain\Services\PersonService;
use App\Modules\Person\Http\Requests\PersonRequest;
use App\Modules\Person\Http\Resources\PersonResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonController extends Controller
{
    use ControllerTrait;

    protected string $service = PersonService::class;

    protected string $resource = PersonResource::class;

    protected string $request = PersonRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: ['guardian'],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail(
            $id,
            ['*'],
            ['guardian', 'creator', 'updater']
        );

        return $this->respondWithItem($model);
    }
}
