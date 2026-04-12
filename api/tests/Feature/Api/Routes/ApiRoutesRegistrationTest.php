<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Routes;

use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Tests\TestCase;

class ApiRoutesRegistrationTest extends TestCase
{
    public function test_api_route_count_matches_baseline(): void
    {
        $count = collect(RouteFacade::getRoutes()->getRoutes())
            ->filter(fn (Route $r) => str_starts_with($r->uri(), 'api/'))
            ->count();

        $this->assertSame(61, $count, 'Atualize este valor e os testes de feature ao registrar ou remover rotas em routes/api.php.');
    }
}
