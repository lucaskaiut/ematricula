import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Layers, Presentation, School, Users } from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
};

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Painel", href: "/", icon: LayoutDashboard, match: "prefix" },
  { label: "Usuários", href: "/users", icon: Users, match: "prefix" },
  { label: "Alunos", href: "/alunos", icon: School, match: "prefix" },
  { label: "Professores", href: "/professores", icon: Presentation, match: "prefix" },
  { label: "Modalidades", href: "/modalidades", icon: Layers, match: "prefix" },
];
