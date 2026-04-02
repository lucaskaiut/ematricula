<?php

declare(strict_types=1);

namespace App\Modules\Core\Domain\Observers;

use App\Modules\Core\Domain\Attributes\TracksUserAudit;
use Illuminate\Database\Eloquent\Model;
use ReflectionClass;

class UserAuditObserver
{
    public function creating(Model $model): void
    {
        $config = $this->auditConfig($model);
        if ($config === null) {
            return;
        }

        $userId = auth()->id();
        if ($userId === null) {
            return;
        }

        $model->setAttribute($config->createdByColumn, $userId);
        $model->setAttribute($config->updatedByColumn, $userId);
    }

    public function updating(Model $model): void
    {
        $config = $this->auditConfig($model);
        if ($config === null) {
            return;
        }

        $userId = auth()->id();
        if ($userId === null) {
            return;
        }

        $model->setAttribute($config->updatedByColumn, $userId);
    }

    private function auditConfig(Model $model): ?TracksUserAudit
    {
        $ref = new ReflectionClass($model);
        $attrs = $ref->getAttributes(TracksUserAudit::class);

        if ($attrs === []) {
            return null;
        }

        return $attrs[0]->newInstance();
    }
}
