import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Layers,
  Presentation,
  School,
  Settings,
  Shield,
  Users,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
  anyOf: string[];
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: "Painel",
    href: "/",
    icon: LayoutDashboard,
    match: "prefix",
    anyOf: ["dashboard.access"],
  },
  {
    label: "Usuários",
    href: "/users",
    icon: Users,
    match: "prefix",
    anyOf: ["users.read", "users.write"],
  },
  {
    label: "Perfis de acesso",
    href: "/perfis",
    icon: Shield,
    match: "prefix",
    anyOf: ["roles.read", "roles.write"],
  },
  {
    label: "Alunos",
    href: "/alunos",
    icon: School,
    match: "prefix",
    anyOf: ["persons.read", "persons.write"],
  },
  {
    label: "Professores",
    href: "/professores",
    icon: Presentation,
    match: "prefix",
    anyOf: ["persons.read", "persons.write"],
  },
  {
    label: "Modalidades",
    href: "/modalidades",
    icon: Layers,
    match: "prefix",
    anyOf: ["modalities.read", "modalities.write"],
  },
  {
    label: "Planos",
    href: "/planos",
    icon: CreditCard,
    match: "prefix",
    anyOf: ["plans.read", "plans.write"],
  },
  {
    label: "Turmas",
    href: "/class-groups",
    icon: BookOpen,
    match: "prefix",
    anyOf: ["class_groups.read", "class_groups.write"],
  },
  {
    label: "Matrículas",
    href: "/matriculas",
    icon: ClipboardList,
    match: "prefix",
    anyOf: ["enrollments.read", "enrollments.write"],
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    match: "prefix",
    anyOf: ["settings.read", "settings.write"],
  },
];
