<?php

declare(strict_types=1);

namespace App\Modules\Setting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Setting\Domain\Services\TenantSettingsService;
use App\Modules\Setting\Http\Requests\UpdateTenantSettingsRequest;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;

class TenantSettingsController extends Controller
{
    public function __construct(
        protected TenantSettingsService $tenantSettings
    ) {
    }

    public function index(): JsonResponse
    {
        $company = app('company')->company();
        if (! $company) {
            return response()->json(['message' => 'Company not found'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->tenantSettings->getGroupedForCompany((int) $company->id);

        return response()->json(['data' => $data]);
    }

    public function update(UpdateTenantSettingsRequest $request): JsonResponse
    {
        $company = app('company')->company();
        if (! $company) {
            return response()->json(['message' => 'Company not found'], Response::HTTP_NOT_FOUND);
        }

        /** @var array<string, mixed|null> $settings */
        $settings = $request->validated('settings');

        try {
            $this->tenantSettings->syncBatch((int) $company->id, $settings);
        } catch (InvalidArgumentException $e) {
            return response()->json(
                ['message' => $e->getMessage()],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $data = $this->tenantSettings->getGroupedForCompany((int) $company->id);

        return response()->json(['data' => $data]);
    }
}
