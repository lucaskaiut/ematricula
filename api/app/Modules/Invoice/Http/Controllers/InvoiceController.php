<?php

declare(strict_types=1);

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\Invoice\Domain\Services\InvoiceService;
use App\Modules\Invoice\Http\Requests\InvoiceUpdateRequest;
use App\Modules\Invoice\Http\Resources\InvoiceResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    use ControllerTrait;

    protected string $service = InvoiceService::class;

    protected string $resource = InvoiceResource::class;

    protected string $request = InvoiceUpdateRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: ['subscription.enrollment', 'subscription.plan'],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail(
            $id,
            ['*'],
            ['subscription.enrollment', 'subscription.plan']
        );

        return $this->respondWithItem($model);
    }

    public function update(int|string $id, InvoiceUpdateRequest $request): JsonResponse
    {
        $model = $this->db()->transaction(
            fn () => $this->service()->update($id, $request->validated())
        );

        return $this->respondWithItem($model);
    }
}
