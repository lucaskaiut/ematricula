<?php

declare(strict_types=1);

namespace App\Modules\Setting\Domain\Enums;

enum SettingType: string
{
    case String = 'string';
    case Boolean = 'boolean';
    case Number = 'number';
    case Select = 'select';
    case Json = 'json';

    public static function tryFromString(string $value): ?self
    {
        return self::tryFrom($value);
    }
}
