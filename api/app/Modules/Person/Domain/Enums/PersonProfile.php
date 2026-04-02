<?php

declare(strict_types=1);

namespace App\Modules\Person\Domain\Enums;

enum PersonProfile: string
{
    case Student = 'student';
    case Teacher = 'teacher';
}
