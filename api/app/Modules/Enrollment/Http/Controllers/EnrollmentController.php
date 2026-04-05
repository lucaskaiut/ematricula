<?php

declare(strict_types=1);

namespace App\Modules\Enrollment\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\Enrollment\Domain\Services\EnrollmentService;
use App\Modules\Enrollment\Http\Requests\EnrollmentRequest;
use App\Modules\Enrollment\Http\Resources\EnrollmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    use ControllerTrait;

    protected string $service = EnrollmentService::class;

    protected string $resource = EnrollmentResource::class;

    protected string $request = EnrollmentRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: ['student', 'classGroup.modality', 'creator', 'updater', 'activeSubscription.plan'],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail(
            $id,
            ['*'],
            ['student', 'classGroup.modality', 'creator', 'updater', 'activeSubscription.plan']
        );

        return $this->respondWithItem($model);
    }
}
