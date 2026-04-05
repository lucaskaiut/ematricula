<?php

declare(strict_types=1);

namespace App\Modules\Subscription\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\Subscription\Domain\Services\SubscriptionRecurrenceService;
use App\Modules\Subscription\Domain\Services\SubscriptionService;
use App\Modules\Subscription\Http\Requests\SubscriptionUpdateRequest;
use App\Modules\Subscription\Http\Resources\SubscriptionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    use ControllerTrait;

    protected string $service = SubscriptionService::class;

    protected string $resource = SubscriptionResource::class;

    protected string $request = SubscriptionUpdateRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: ['enrollment.student', 'plan'],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail(
            $id,
            ['*'],
            ['enrollment.student', 'plan', 'invoices']
        );

        return $this->respondWithItem($model);
    }

    public function update(int|string $id, SubscriptionUpdateRequest $request): JsonResponse
    {
        $model = $this->db()->transaction(
            fn () => $this->service()->update($id, $request->validated())
        );

        return $this->respondWithItem($model);
    }

    public function generateNextInvoice(int|string $id, SubscriptionRecurrenceService $recurrence): JsonResponse
    {
        $model = $recurrence->generateNextInvoiceManually($id);

        return $this->respondWithItem($model);
    }
}
