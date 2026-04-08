"use client";

import type { ApiResponse } from "@/lib/api";
import type { RoleAttributes } from "@/types/api";

export const rolesQueryKey = ["roles"] as const;

export async function listRoles(searchParams?: URLSearchParams) {
  const qs = searchParams?.toString();
  const url = qs ? `/api/roles?${qs}` : "/api/roles?per_page=100";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Falha ao carregar perfis");
  }
  return (await res.json()) as ApiResponse<RoleAttributes[]>;
}

export async function deleteRole({ id }: { id: number }) {
  const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Não foi possível excluir o perfil.");
  }
}
