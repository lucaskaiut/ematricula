<?php

declare(strict_types=1);

namespace App\Modules\Setting\Domain\Services;

use App\Modules\Company\Domain\Models\Company;
use App\Modules\Setting\Domain\Models\Setting;
use App\Modules\Setting\Domain\Models\TenantSetting;
use App\Modules\Setting\Domain\Support\SettingValueCodec;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class TenantSettingsService
{
    public function cacheKey(int $companyId): string
    {
        return "company:{$companyId}:settings";
    }

    public function forgetCache(int $companyId): void
    {
        Cache::forget($this->cacheKey($companyId));
    }

    public function forgetAllCompaniesCache(): void
    {
        Company::query()->pluck('id')->each(function (mixed $id): void {
            $this->forgetCache((int) $id);
        });
    }

    public function getInt(int $companyId, string $key, int $fallback): int
    {
        foreach ($this->getGroupedForCompany($companyId) as $items) {
            foreach ($items as $item) {
                if (($item['key'] ?? null) !== $key) {
                    continue;
                }
                $value = $item['value'] ?? null;
                if (! is_numeric($value)) {
                    return $fallback;
                }

                return max(0, (int) round((float) $value));
            }
        }

        return $fallback;
    }

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    public function getGroupedForCompany(int $companyId): array
    {
        return Cache::rememberForever($this->cacheKey($companyId), function () use ($companyId) {
            return $this->buildGrouped($companyId);
        });
    }

    public function getValue(int $companyId, string $key): mixed
    {
        $grouped = $this->getGroupedForCompany($companyId);
        foreach ($grouped as $items) {
            foreach ($items as $item) {
                if (($item['key'] ?? '') === $key) {
                    return $item['value'] ?? null;
                }
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed|null>  $settings
     */
    public function syncBatch(int $companyId, array $settings): void
    {
        $keys = array_keys($settings);
        if ($keys === []) {
            return;
        }

        $definitions = Setting::query()
            ->whereIn('key', $keys)
            ->get()
            ->keyBy('key');

        $missing = array_diff($keys, $definitions->keys()->all());
        if ($missing !== []) {
            throw new InvalidArgumentException('Chaves desconhecidas: '.implode(', ', $missing));
        }

        DB::transaction(function () use ($companyId, $settings, $definitions) {
            foreach ($settings as $key => $value) {
                /** @var Setting $def */
                $def = $definitions->get($key);
                if ($value === null) {
                    TenantSetting::query()
                        ->where('company_id', $companyId)
                        ->where('setting_id', $def->id)
                        ->delete();

                    continue;
                }

                SettingValueCodec::validateIncoming($def, $value);

                $encoded = SettingValueCodec::encodeForStorage($def->type, $value);

                TenantSetting::query()->updateOrCreate(
                    [
                        'company_id' => $companyId,
                        'setting_id' => $def->id,
                    ],
                    ['value' => $encoded],
                );
            }
        });

        $this->forgetCache($companyId);
    }

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    private function buildGrouped(int $companyId): array
    {
        $rows = Setting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->get();

        $overrides = TenantSetting::query()
            ->where('company_id', $companyId)
            ->get()
            ->keyBy('setting_id');

        $grouped = [];

        foreach ($rows as $setting) {
            $type = $setting->type;
            $override = $overrides->get($setting->id);
            $stored = $override?->value;

            $value = SettingValueCodec::decodeValue(
                $type,
                $stored,
                $setting->default_value
            );

            $defaultValue = SettingValueCodec::decodeDefault(
                $type,
                $setting->default_value
            );

            $item = [
                'key' => $setting->key,
                'label' => $setting->label,
                'description' => $setting->description,
                'type' => $type->value,
                'value' => $value,
                'default_value' => $defaultValue,
            ];

            if ($type->value === 'select' && is_array($setting->options)) {
                $item['options'] = array_values(array_map(static fn ($o) => (string) $o, $setting->options));
            }

            $group = $setting->group;
            if (! isset($grouped[$group])) {
                $grouped[$group] = [];
            }
            $grouped[$group][] = $item;
        }

        ksort($grouped);

        return $grouped;
    }
}
