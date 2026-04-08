<?php

declare(strict_types=1);

namespace App\Modules\Setting\Domain\Support;

use App\Modules\Setting\Domain\Enums\SettingType;
use App\Modules\Setting\Domain\Models\Setting;
use InvalidArgumentException;

final class SettingValueCodec
{
    public static function decodeValue(SettingType $type, ?string $stored, ?string $defaultRaw): mixed
    {
        $raw = $stored !== null && $stored !== '' ? $stored : $defaultRaw;

        return match ($type) {
            SettingType::Boolean => self::decodeBoolean($raw),
            SettingType::Number => self::decodeNumber($raw),
            SettingType::String, SettingType::Select => $raw === null ? '' : (string) $raw,
            SettingType::Json => self::decodeJson($raw),
        };
    }

    public static function decodeDefault(SettingType $type, ?string $defaultRaw): mixed
    {
        return self::decodeValue($type, null, $defaultRaw);
    }

    public static function encodeForStorage(SettingType $type, mixed $value): string
    {
        return match ($type) {
            SettingType::Boolean => self::encodeBoolean($value),
            SettingType::Number => self::encodeNumber($value),
            SettingType::String, SettingType::Select => self::encodeString($value),
            SettingType::Json => self::encodeJson($value),
        };
    }

    public static function validateIncoming(Setting $setting, mixed $value): void
    {
        $type = $setting->type;
        if (! $type instanceof SettingType) {
            throw new InvalidArgumentException('Tipo de configuração inválido.');
        }

        match ($type) {
            SettingType::Boolean => self::assertBoolean($value),
            SettingType::Number => self::assertNumber($value),
            SettingType::String => self::assertString($value),
            SettingType::Select => self::assertSelect($setting, $value),
            SettingType::Json => self::assertJson($value),
        };
    }

    private static function decodeBoolean(?string $raw): bool
    {
        if ($raw === null || $raw === '') {
            return false;
        }

        $n = strtolower(trim($raw));

        return in_array($n, ['1', 'true', 'yes', 'on'], true);
    }

    private static function decodeNumber(?string $raw): ?float
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        if (! is_numeric($raw)) {
            return null;
        }

        return $raw + 0;
    }

    private static function decodeJson(?string $raw): mixed
    {
        if ($raw === null || $raw === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return $raw;
        }

        return $decoded;
    }

    private static function encodeBoolean(mixed $value): string
    {
        self::assertBoolean($value);
        $b = match (true) {
            is_bool($value) => $value,
            is_int($value) => $value === 1,
            default => filter_var($value, FILTER_VALIDATE_BOOLEAN),
        };

        return $b ? 'true' : 'false';
    }

    private static function encodeNumber(mixed $value): string
    {
        self::assertNumber($value);
        $n = $value + 0;

        return (string) $n;
    }

    private static function encodeString(mixed $value): string
    {
        self::assertString($value);

        return trim((string) $value);
    }

    private static function encodeJson(mixed $value): string
    {
        if (is_string($value)) {
            $trim = trim($value);
            if ($trim === '') {
                return '{}';
            }
            json_decode($trim, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new InvalidArgumentException('JSON inválido.');
            }

            $normalized = json_encode(
                json_decode($trim, true, 512, JSON_THROW_ON_ERROR),
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE
            );

            return $normalized;
        }

        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    private static function assertBoolean(mixed $value): void
    {
        if (is_bool($value)) {
            return;
        }
        if (is_int($value) && ($value === 0 || $value === 1)) {
            return;
        }
        if (is_string($value)) {
            $n = strtolower(trim($value));
            if (in_array($n, ['0', '1', 'true', 'false', 'yes', 'no', 'on', 'off'], true)) {
                return;
            }
        }
        throw new InvalidArgumentException('Valor deve ser booleano.');
    }

    private static function assertNumber(mixed $value): void
    {
        if (! is_numeric($value)) {
            throw new InvalidArgumentException('Valor deve ser numérico.');
        }
    }

    private static function assertString(mixed $value): void
    {
        if (is_string($value) || is_int($value) || is_float($value)) {
            return;
        }
        throw new InvalidArgumentException('Valor deve ser texto.');
    }

    private static function assertSelect(Setting $setting, mixed $value): void
    {
        self::assertString($value);
        $options = $setting->options;
        if (! is_array($options) || $options === []) {
            throw new InvalidArgumentException('Select sem opções definidas.');
        }
        $v = trim((string) $value);
        $flat = array_map(static fn ($o) => (string) $o, $options);
        if (! in_array($v, $flat, true)) {
            throw new InvalidArgumentException('Opção inválida para '.$setting->key.'.');
        }
    }

    private static function assertJson(mixed $value): void
    {
        if (is_array($value)) {
            return;
        }
        if (! is_string($value)) {
            throw new InvalidArgumentException('JSON deve ser texto ou objeto.');
        }
        $trim = trim($value);
        if ($trim === '') {
            return;
        }
        json_decode($trim, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new InvalidArgumentException('JSON inválido.');
        }
    }
}
