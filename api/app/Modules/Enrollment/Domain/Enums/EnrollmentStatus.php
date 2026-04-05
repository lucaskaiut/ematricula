<?php

declare(strict_types=1);

namespace App\Modules\Enrollment\Domain\Enums;

enum EnrollmentStatus: string
{
    case Active = 'active';
    case Locked = 'locked';
    case Cancelled = 'cancelled';
}
