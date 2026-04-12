<?php

declare(strict_types=1);

namespace Tests\Feature\Api\User;

use App\Modules\Acl\Domain\Enums\Permission;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\Api\ApiTestCase;
use Tests\Feature\Api\Concerns\CreatesTenantContext;

class UserMeTest extends ApiTestCase
{
    use CreatesTenantContext;

    public function test_guest_cannot_access_me(): void
    {
        $this->getJson('/api/user/me')->assertUnauthorized();
    }

    public function test_guest_cannot_patch_me_avatar(): void
    {
        $this->patchJson('/api/user/me', [])->assertUnauthorized();
    }

    public function test_authenticated_user_receives_own_profile(): void
    {
        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::DashboardAccess->value], 'Mínimo');
        $user = $this->createUserForCompany($company, $role, ['email' => 'me@test.local']);

        $this->withHeaders($this->bearerHeaders($user))
            ->getJson('/api/user/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', 'me@test.local')
            ->assertJsonStructure(['data' => ['role', 'permissions', 'avatar_url']]);
    }

    public function test_authenticated_user_can_update_own_avatar(): void
    {
        Storage::fake('public');

        $company = $this->createCompany();
        $role = $this->createRoleForCompany($company, [Permission::DashboardAccess->value], 'Mínimo');
        $user = $this->createUserForCompany($company, $role, ['email' => 'avatar-me@test.local']);

        $file = UploadedFile::fake()->image('new.jpg', 80, 80);

        $response = $this->withHeaders($this->bearerHeaders($user))
            ->patch('/api/user/me', [
                'avatar' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.email', 'avatar-me@test.local');

        $this->assertNotNull($response->json('data.avatar_url'));

        $user->refresh();
        $this->assertNotNull($user->avatar);
        Storage::disk('public')->assertExists($user->avatar);
    }
}
