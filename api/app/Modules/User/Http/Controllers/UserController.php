<?php

namespace App\Modules\User\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Http\Traits\ControllerTrait;
use App\Modules\User\Domain\Services\UserService;
use App\Modules\User\Http\Requests\UserLoginRequest;
use App\Modules\User\Http\Requests\UserRegisterRequest;
use App\Modules\User\Http\Requests\UserRequest;
use App\Modules\User\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ControllerTrait;

    protected string $service = UserService::class;

    protected string $resource = UserResource::class;

    protected string $request = UserRequest::class;

    public function index(Request $request): JsonResponse
    {
        $filters = (array) $request->query('filters', []);
        $orderBy = (array) $request->query('orderBy', []);
        $perPage = (int) $request->query('per_page', 15);

        $result = $this->service()->paginate(
            perPage: $perPage,
            conditions: $filters,
            relations: ['role'],
            orderBy: $orderBy
        );

        return $this->respondWithCollection($result);
    }

    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->findOrFail($id, ['*'], ['role']);

        return $this->respondWithItem($model);
    }

    public function register(UserRegisterRequest $request)
    {
        $validated = $request->validated();

        return $this->db()->transaction(function () use ($validated) {
            $model = $this->service()->register($validated);
            $model->load('role');

            return $this->respondWithItem($model, 201);
        });
    }

    public function login(UserLoginRequest $request)
    {
        $validated = $request->validated();

        return $this->db()->transaction(function () use ($validated) {
            $model = $this->service()->login($validated);

            return $this->respondWithItem($model, 201);
        });
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if(! $user, 401);

        $user->loadMissing('role');

        return $this->respondWithItem($user);
    }
}
