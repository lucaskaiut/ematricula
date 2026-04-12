<?php

declare(strict_types=1);

namespace Tests\Feature\Api\User;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\Api\ApiTestCase;

class UserAuthTest extends ApiTestCase
{
    public function test_register_creates_company_user_and_returns_201(): void
    {
        $response = $this->postJson('/api/users/register', [
            'company' => [
                'name' => 'Escola Integração',
                'email' => 'contato@escola-integracao.test',
                'phone' => '11999990000',
            ],
            'user' => [
                'name' => 'Diretor',
                'email' => 'diretor@escola-integracao.test',
                'password' => 'senha1234',
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'diretor@escola-integracao.test');

        $this->assertDatabaseHas('companies', ['email' => 'contato@escola-integracao.test']);
        $this->assertDatabaseHas('users', ['email' => 'diretor@escola-integracao.test']);
    }

    public function test_register_with_avatar_persists_file_and_returns_avatar_url(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('face.jpg', 100, 100);

        $response = $this->post('/api/users/register', [
            'company' => [
                'name' => 'Escola Avatar',
                'email' => 'contato@escola-avatar.test',
                'phone' => '11999990001',
            ],
            'user' => [
                'name' => 'Com Foto',
                'email' => 'usuario@escola-avatar.test',
                'password' => 'senha1234',
                'avatar' => $file,
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'usuario@escola-avatar.test');

        $this->assertNotNull($response->json('data.avatar_url'));

        $this->assertDatabaseHas('users', ['email' => 'usuario@escola-avatar.test']);

        $path = \App\Models\User::query()->where('email', 'usuario@escola-avatar.test')->value('avatar');
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_register_validation_errors_return_422(): void
    {
        $this->postJson('/api/users/register', [
            'company' => ['name' => '', 'email' => 'invalid', 'phone' => ''],
            'user' => ['name' => '', 'email' => 'bad', 'password' => 'short'],
        ])->assertUnprocessable();
    }

    public function test_login_returns_token_and_201(): void
    {
        $this->postJson('/api/users/register', [
            'company' => [
                'name' => 'Escola Login',
                'email' => 'c2@login.test',
                'phone' => '11888880000',
            ],
            'user' => [
                'name' => 'Admin Login',
                'email' => 'u2@login.test',
                'password' => 'senha1234',
            ],
        ])->assertCreated();

        $login = $this->postJson('/api/users/login', [
            'email' => 'u2@login.test',
            'password' => 'senha1234',
        ]);

        $login->assertCreated()
            ->assertJsonStructure(['data' => ['token']])
            ->assertJsonPath('data.email', 'u2@login.test');
    }

    public function test_login_validation_errors_return_422(): void
    {
        $this->postJson('/api/users/login', [
            'email' => 'not-an-email',
            'password' => '',
        ])->assertUnprocessable();
    }

    public function test_login_with_invalid_credentials_returns_500(): void
    {
        $this->postJson('/api/users/login', [
            'email' => 'nobody@test.local',
            'password' => 'wrongpassword',
        ])->assertServerError();
    }
}
