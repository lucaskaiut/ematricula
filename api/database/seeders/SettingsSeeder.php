<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Modules\Setting\Domain\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'key' => 'invoice.due_days',
                'label' => 'Dias para vencimento',
                'description' => 'Prazo padrão entre emissão e vencimento da fatura.',
                'type' => 'number',
                'default_value' => '7',
                'options' => null,
                'group' => 'invoice',
            ],
            [
                'key' => 'invoice.payment_method',
                'label' => 'Método de pagamento',
                'description' => 'Gateway usado ao gerar cobrança e link de pagamento para faturas.',
                'type' => 'select',
                'default_value' => 'generic',
                'options' => array_values(array_keys(config('payments.gateways', []))),
                'group' => 'invoice',
            ],
            [
                'key' => 'asaas.api_key',
                'label' => 'Chave da API do Asaas',
                'description' => 'Chave da API do Asaas para integração com o sistema de pagamentos.',
                'type' => 'string',
                'default_value' => '',
                'options' => null,
                'group' => 'asaas',
            ],
            [
                'key' => 'asaas.environment',
                'label' => 'Ambiente do Asaas',
                'description' => 'Ambiente do Asaas para integração com o sistema de pagamentos.',
                'type' => 'select',
                'default_value' => 'sandbox',
                'options' => ['sandbox', 'production'],
                'group' => 'asaas',
            ],
        ];

        foreach ($rows as $row) {
            Setting::query()->updateOrCreate(
                ['key' => $row['key']],
                $row
            );
        }
    }
}
