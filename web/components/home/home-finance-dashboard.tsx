"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatCurrencyBrl } from "@/lib/currency-brl";
import type { ApiResponse } from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

function kpiLabel(amount: string, count: number) {
  const c = count === 1 ? "1 fatura" : `${count} faturas`;
  return `${formatCurrencyBrl(amount)} · ${c}`;
}

type KpiCardProps = {
  title: string;
  value: string;
  hint: string;
  href: string;
};

function KpiCard({ title, value, hint, href }: KpiCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-border bg-card/60 p-5 shadow-card transition-colors hover:bg-card sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-secondary group-hover:text-foreground/80">{hint}</p>
    </Link>
  );
}

export function HomeFinanceDashboard() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set("days", "7");
      const res = await fetch(`/api/dashboard/summary?${p}`);
      if (!res.ok) throw new Error("Falha ao carregar o dashboard");
      return (await res.json()) as ApiResponse<DashboardSummary>;
    },
  });

  const summary = data?.data ?? null;

  return (
    <section className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Financeiro
        </h2>
        <p className="text-sm text-secondary">
          Visão rápida de cobranças e inadimplência.
        </p>
      </div>

      {isPending ? (
        <div
          className="flex min-h-[160px] items-center justify-center rounded-2xl border border-border/60 bg-card/80 text-sm text-muted"
          role="status"
        >
          Carregando resumo…
        </div>
      ) : null}

      {isError ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error instanceof Error
            ? error.message
            : "Não foi possível carregar o dashboard."}
        </div>
      ) : null}

      {!isPending && !isError && summary ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard
              title="Vencidas"
              value={summary.kpis.overdue.count.toString()}
              hint={kpiLabel(
                summary.kpis.overdue.amount_sum,
                summary.kpis.overdue.count,
              )}
              href="/matriculas"
            />
            <KpiCard
              title={`Vencem até ${formatDateOnly(summary.range.until)}`}
              value={summary.kpis.due_soon.count.toString()}
              hint={kpiLabel(
                summary.kpis.due_soon.amount_sum,
                summary.kpis.due_soon.count,
              )}
              href="/matriculas"
            />
            <KpiCard
              title="Recebidas no mês"
              value={formatCurrencyBrl(summary.kpis.paid_this_month.amount_sum)}
              hint={kpiLabel(
                summary.kpis.paid_this_month.amount_sum,
                summary.kpis.paid_this_month.count,
              )}
              href="/matriculas"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-card border border-border bg-card/60 p-5 shadow-card sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Vencimentos próximos
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Próximos {summary.lists.upcoming_invoices.length} vencimentos (até{" "}
                    {formatDateOnly(summary.range.until)}).
                  </p>
                </div>
                <Link
                  href="/matriculas"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Ver matrículas
                </Link>
              </div>

              <div className="mt-4 overflow-hidden rounded-control border border-border">
                {summary.lists.upcoming_invoices.length === 0 ? (
                  <div className="bg-card px-4 py-8 text-center text-sm text-muted">
                    Nenhuma fatura pendente neste período.
                  </div>
                ) : (
                  <ul className="divide-y divide-border bg-card">
                    {summary.lists.upcoming_invoices.map((inv) => (
                      <li key={inv.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {inv.student?.full_name ?? `Matrícula #${inv.enrollment_id ?? "—"}`}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted">
                              Vence em {formatDateOnly(inv.due_date)}
                              {inv.plan?.name ? ` · ${inv.plan.name}` : ""}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-foreground">
                            {formatCurrencyBrl(inv.amount)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-card border border-border bg-card/60 p-5 shadow-card sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Alunos inadimplentes
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    Maiores saldos vencidos (pendências anteriores a{" "}
                    {formatDateOnly(summary.range.today)}).
                  </p>
                </div>
                <Link
                  href="/alunos"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Ver alunos
                </Link>
              </div>

              <div className="mt-4 overflow-hidden rounded-control border border-border">
                {summary.lists.delinquent_students.length === 0 ? (
                  <div className="bg-card px-4 py-8 text-center text-sm text-muted">
                    Nenhum aluno inadimplente encontrado.
                  </div>
                ) : (
                  <ul className="divide-y divide-border bg-card">
                    {summary.lists.delinquent_students.map((row) => (
                      <li key={row.student.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/alunos/${row.student.id}/edit`}
                              className="truncate text-sm font-medium text-foreground underline-offset-2 hover:underline"
                            >
                              {row.student.full_name}
                            </Link>
                            <p className="mt-0.5 truncate text-xs text-muted">
                              {row.overdue.count === 1
                                ? "1 fatura vencida"
                                : `${row.overdue.count} faturas vencidas`}
                              {row.next_due_date
                                ? ` · desde ${formatDateOnly(row.next_due_date)}`
                                : ""}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-foreground">
                            {formatCurrencyBrl(row.overdue.amount_sum)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

