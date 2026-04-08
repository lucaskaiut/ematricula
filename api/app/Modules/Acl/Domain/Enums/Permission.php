<?php

declare(strict_types=1);

namespace App\Modules\Acl\Domain\Enums;

enum Permission: string
{
    case DashboardAccess = 'dashboard.access';

    case PersonsRead = 'persons.read';
    case PersonsWrite = 'persons.write';

    case ModalitiesRead = 'modalities.read';
    case ModalitiesWrite = 'modalities.write';

    case PlansRead = 'plans.read';
    case PlansWrite = 'plans.write';

    case ClassGroupsRead = 'class_groups.read';
    case ClassGroupsWrite = 'class_groups.write';

    case EnrollmentsRead = 'enrollments.read';
    case EnrollmentsWrite = 'enrollments.write';

    case InvoicesRead = 'invoices.read';
    case InvoicesWrite = 'invoices.write';

    case SubscriptionsRead = 'subscriptions.read';
    case SubscriptionsWrite = 'subscriptions.write';

    case PaymentsSync = 'payments.sync';

    case UsersRead = 'users.read';
    case UsersWrite = 'users.write';

    case RolesRead = 'roles.read';
    case RolesWrite = 'roles.write';

    case SettingsRead = 'settings.read';
    case SettingsWrite = 'settings.write';

    public function label(): string
    {
        return match ($this) {
            self::DashboardAccess => 'Painel e agenda',

            self::PersonsRead => 'Pessoas: visualizar',
            self::PersonsWrite => 'Pessoas: criar e editar',

            self::ModalitiesRead => 'Modalidades: visualizar',
            self::ModalitiesWrite => 'Modalidades: criar e editar',

            self::PlansRead => 'Planos: visualizar',
            self::PlansWrite => 'Planos: criar e editar',

            self::ClassGroupsRead => 'Turmas: visualizar',
            self::ClassGroupsWrite => 'Turmas: criar e editar',

            self::EnrollmentsRead => 'Matrículas: visualizar',
            self::EnrollmentsWrite => 'Matrículas: criar e editar',

            self::InvoicesRead => 'Faturas: visualizar',
            self::InvoicesWrite => 'Faturas: registrar pagamentos e alterar',

            self::SubscriptionsRead => 'Assinaturas: visualizar',
            self::SubscriptionsWrite => 'Assinaturas: alterar e gerar faturas',

            self::PaymentsSync => 'Pagamentos: sincronizar status',

            self::UsersRead => 'Usuários: visualizar',
            self::UsersWrite => 'Usuários: criar e editar',

            self::RolesRead => 'Perfis: visualizar',
            self::RolesWrite => 'Perfis: criar e editar',

            self::SettingsRead => 'Configurações: visualizar',
            self::SettingsWrite => 'Configurações: alterar',
        };
    }

    public function category(): string
    {
        return match ($this) {
            self::DashboardAccess => 'Geral',

            self::PersonsRead,
            self::PersonsWrite,
            self::ModalitiesRead,
            self::ModalitiesWrite,
            self::PlansRead,
            self::PlansWrite,
            self::ClassGroupsRead,
            self::ClassGroupsWrite => 'Cadastros',

            self::EnrollmentsRead,
            self::EnrollmentsWrite,
            self::InvoicesRead,
            self::InvoicesWrite,
            self::SubscriptionsRead,
            self::SubscriptionsWrite,
            self::PaymentsSync => 'Operações',

            self::UsersRead,
            self::UsersWrite,
            self::RolesRead,
            self::RolesWrite,
            self::SettingsRead,
            self::SettingsWrite => 'Administração',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $p) => $p->value, self::cases());
    }

    /**
     * @return list<array{key: string, label: string, category: string}>
     */
    public static function definitions(): array
    {
        $out = [];
        foreach (self::cases() as $case) {
            $out[] = [
                'key' => $case->value,
                'label' => $case->label(),
                'category' => $case->category(),
            ];
        }

        return $out;
    }
}
