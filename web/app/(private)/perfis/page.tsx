"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DataGrid } from "@/components/DataGrid";
import { Page } from "@/components/Page";
import { userHasAnyPermission } from "@/lib/acl/can";
import type { RoleAttributes } from "@/types/api";
import { deleteRole, listRoles, rolesQueryKey } from "./actions";

export default function PerfisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const canWrite = userHasAnyPermission(user, ["roles.write"]);

  const listUpdated = searchParams.get("updated");

  useEffect(() => {
    if (listUpdated !== "1") return;
    void queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    const next = new URLSearchParams(searchParams.toString());
    next.delete("updated");
    const qs = next.toString();
    router.replace(qs ? `/perfis?${qs}` : "/perfis");
  }, [listUpdated, queryClient, router, searchParams]);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: rolesQueryKey,
    queryFn: () => listRoles(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
    onError: (e: Error) => {
      window.alert(e.message);
    },
  });

  const handleDelete = useCallback(
    (row: RoleAttributes) => {
      if (deleteMutation.isPending) return;
      const ok = window.confirm(`Excluir o perfil "${row.name}"?`);
      if (!ok) return;
      deleteMutation.mutate({ id: row.id });
    },
    [deleteMutation],
  );

  const handleEdit = useCallback(
    (row: RoleAttributes) => {
      router.push(`/perfis/${row.id}/edit`);
    },
    [router],
  );

  const columns = useMemo(
    () => [
      { key: "id", title: "#", priority: 0, sortable: true, width: 72 },
      { key: "name", title: "Nome", priority: 1, sortable: true, width: 220 },
      {
        key: "description",
        title: "Descrição",
        priority: 2,
        sortable: false,
        width: 280,
        format: (v: unknown) =>
          typeof v === "string" && v ? v : "—",
      },
      {
        key: "permissions",
        title: "Permissões",
        priority: 3,
        sortable: false,
        width: 120,
        format: (v: unknown) =>
          Array.isArray(v) ? String(v.length) : "0",
      },
    ],
    [],
  );

  const loading = isLoading || isFetching;

  return (
    <Page.Root>
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Perfis de acesso
        </h1>
        {canWrite ? (
          <Link
            href="/perfis/new"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-linear-to-br from-primary to-primary-end px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 sm:min-h-10"
          >
            Novo perfil
          </Link>
        ) : null}
      </div>

      <Page.List>
        <DataGrid.Table<RoleAttributes>
          data={response?.data ?? []}
          columns={columns}
          loading={loading}
          onEdit={canWrite ? handleEdit : undefined}
          onDelete={canWrite ? handleDelete : undefined}
        />
      </Page.List>
    </Page.Root>
  );
}
