<?php

declare(strict_types=1);

namespace App\Modules\Core\Domain\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
class TracksUserAudit
{
    public function __construct(
        public string $createdByColumn = 'created_by',
        public string $updatedByColumn = 'updated_by',
    ) {}
}
