"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import type { PermissionDefinition } from "@/types/api";
import {
  roleFormSchema,
  type RoleFormValues,
} from "@/lib/validations/role-form";

import {
  saveRoleAction,
  type SaveRoleActionResult,
} from "../save-role-action";

const inputClass =
  "mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none transition-[box-shadow,border-color] placeholder:text-placeholder focus:border-primary/55 focus:ring-2 focus:ring-primary/25";

const labelClass = "text-sm font-medium text-secondary";

export type RoleFormProps = {
  mode: "create" | "edit";
  roleId?: number;
  defaultValues: RoleFormValues;
};

export function RoleForm({ mode, roleId, defaultValues }: RoleFormProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues,
  });

  const { data: catalogRes } = useQuery({
    queryKey: ["acl-permissions-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/acl/permissions");
      if (!res.ok) throw new Error("Falha ao carregar permissões");
      return (await res.json()) as { data: PermissionDefinition[] };
    },
  });

  const byCategory = useMemo(() => {
    const list = catalogRes?.data ?? [];
    const map = new Map<string, PermissionDefinition[]>();
    for (const item of list) {
      const prev = map.get(item.category) ?? [];
      prev.push(item);
      map.set(item.category, prev);
    }
    return map;
  }, [catalogRes?.data]);

  const [pending, startTransition] = useTransition();

  const applyServerErrors = (
    result: Extract<SaveRoleActionResult, { success: false }>,
  ) => {
    if (result.fieldErrors) {
      for (const key of ["name", "description", "permissions"] as const) {
        const msg = result.fieldErrors[key];
        if (msg) form.setError(key, { message: msg });
      }
    }
    if (
      result.message &&
      (!result.fieldErrors || Object.keys(result.fieldErrors).length === 0)
    ) {
      form.setError("root", { type: "server", message: result.message });
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    form.clearErrors("root");
    startTransition(async () => {
      const result = await saveRoleAction({ mode, roleId, values });
      if (!result.success) {
        applyServerErrors(result);
      }
    });
  });

  const title = mode === "create" ? "Novo perfil" : "Editar perfil";
  const subtitle =
    mode === "create"
      ? "Defina o nome e as permissões deste perfil de acesso."
      : "Atualize o nome, a descrição ou as permissões.";

  const selected = new Set(form.watch("permissions"));

  const togglePermission = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    form.setValue("permissions", [...next], { shouldValidate: true });
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] w-full min-w-0 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full min-w-0">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Perfis de acesso
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-prose text-pretty text-sm leading-relaxed text-secondary sm:max-w-none">
            {subtitle}
          </p>
        </header>

        <div className="w-full min-w-0 rounded-card border border-border bg-card p-5 shadow-card sm:p-8">
          <form onSubmit={onSubmit} className="space-y-8" noValidate>
            {form.formState.errors.root?.message ? (
              <div
                role="alert"
                className="rounded-control border border-red-200 bg-red-50/90 px-3.5 py-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/45 dark:text-red-200"
              >
                {form.formState.errors.root.message}
              </div>
            ) : null}

            <div>
              <label htmlFor="role-name" className={labelClass}>
                Nome
              </label>
              <input
                id="role-name"
                type="text"
                autoComplete="off"
                className={inputClass}
                {...form.register("name")}
              />
              {form.formState.errors.name?.message ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="role-desc" className={labelClass}>
                Descrição (opcional)
              </label>
              <textarea
                id="role-desc"
                rows={3}
                className={inputClass}
                {...form.register("description")}
              />
              {form.formState.errors.description?.message ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.description.message}
                </p>
              ) : null}
            </div>

            <div>
              <p className={labelClass}>Permissões</p>
              <p className="mt-1 text-xs text-muted">
                Marque o que este perfil pode acessar na API, nas telas e no
                menu.
              </p>
              <div className="mt-4 space-y-6">
                {byCategory.size === 0 ? (
                  <p className="text-sm text-secondary">Carregando permissões…</p>
                ) : (
                  [...byCategory.entries()].map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                        {category}
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {items.map((item) => (
                          <li key={item.key}>
                            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-border bg-card-subtle px-3 py-2.5 text-sm transition-colors hover:border-primary/30">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                                checked={selected.has(item.key)}
                                onChange={() => togglePermission(item.key)}
                              />
                              <span>
                                <span className="font-medium text-foreground">
                                  {item.label}
                                </span>
                                <span className="mt-0.5 block font-mono text-[11px] text-muted">
                                  {item.key}
                                </span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
              {form.formState.errors.permissions?.message ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.permissions.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-input disabled:opacity-60"
              >
                {pending ? "Salvando…" : "Salvar"}
              </button>
              <Link
                href="/perfis"
                className="inline-flex items-center rounded-control border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-input"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
