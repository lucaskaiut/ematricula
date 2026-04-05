'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ApiResponse } from '@/lib/api';
import { formatCurrencyBrl } from '@/lib/currency-brl';
import type { InvoiceAttributes } from '@/types/api';

export type EnrollmentBillingPanelProps = {
  subscriptionId: number;
  subscriptionStatus: 'active' | 'canceled';
};

function formatDateOnly(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d);
}

function invoiceStatusPt(s: InvoiceAttributes['status']) {
  if (s === 'paid') return 'Paga';
  if (s === 'pending') return 'Pendente';
  return s;
}

export function EnrollmentBillingPanel({
  subscriptionId,
  subscriptionStatus,
}: EnrollmentBillingPanelProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyInvoiceId, setBusyInvoiceId] = useState<number | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      p.set('per_page', '100');
      p.set('filters[subscription_id]', String(subscriptionId));
      p.append('orderBy[due_date]', 'desc');
      const res = await fetch(`/api/invoices?${p}`);
      if (!res.ok) throw new Error('Falha ao carregar faturas');
      const json = (await res.json()) as ApiResponse<InvoiceAttributes[]>;
      setInvoices(json.data ?? []);
    } catch {
      setError('Não foi possível carregar as faturas.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const markPaid = async (invoiceId: number) => {
    setBusyInvoiceId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (!res.ok) throw new Error();
      await load();
      router.refresh();
    } catch {
      setError('Não foi possível registrar o pagamento.');
    } finally {
      setBusyInvoiceId(null);
    }
  };

  const generateNextInvoice = async () => {
    setGenerateBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/subscriptions/${subscriptionId}/generate-next-invoice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { message?: string; errors?: Record<string, string[]> }
          | null;
        const msg =
          payload?.message ??
          (payload?.errors?.subscription?.[0] as string | undefined) ??
          'Não foi possível gerar a fatura.';
        throw new Error(msg);
      }
      await load();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível gerar a fatura.');
    } finally {
      setGenerateBusy(false);
    }
  };

  const cancelSubscription = async () => {
    const ok = window.confirm(
      'Cancelar esta assinatura? Novas cobranças automáticas não serão geradas.',
    );
    if (!ok) return;
    setCancelBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'canceled' }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError('Não foi possível cancelar a assinatura.');
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <div className="rounded-card border border-border bg-card/60 p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Cobrança e faturas</h2>
          <p className="mt-1 text-xs text-muted">
            Assinatura #{subscriptionId} ·{' '}
            {subscriptionStatus === 'active' ? 'Ativa' : 'Cancelada'}
          </p>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
            O sistema gera a fatura automaticamente alguns dias antes do vencimento; o pagamento
            continua com vencimento na data do ciclo. Use o botão abaixo para antecipar a próxima
            fatura quando necessário.
          </p>
        </div>
        {subscriptionStatus === 'active' ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={generateBusy}
              onClick={() => void generateNextInvoice()}
              className="inline-flex min-h-9 items-center justify-center rounded-control bg-linear-to-br from-primary to-primary-end px-3 text-xs font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {generateBusy ? 'Gerando…' : 'Gerar próxima fatura'}
            </button>
            <button
              type="button"
              disabled={cancelBusy}
              onClick={() => void cancelSubscription()}
              className="inline-flex min-h-9 items-center justify-center rounded-control px-3 text-xs font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:ring-red-900/60 dark:hover:bg-red-950/40"
            >
              {cancelBusy ? 'Cancelando…' : 'Cancelar assinatura'}
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-control border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-accent/40 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Vencimento</th>
              <th className="px-3 py-2.5">Valor</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  Nenhuma fatura encontrada.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="bg-card">
                  <td className="px-3 py-2.5 font-mono text-xs text-secondary">{inv.id}</td>
                  <td className="px-3 py-2.5">{formatDateOnly(inv.due_date)}</td>
                  <td className="px-3 py-2.5">{formatCurrencyBrl(inv.amount)}</td>
                  <td className="px-3 py-2.5">{invoiceStatusPt(inv.status)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {inv.status === 'pending' ? (
                      <button
                        type="button"
                        disabled={busyInvoiceId === inv.id}
                        onClick={() => void markPaid(inv.id)}
                        className="text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        {busyInvoiceId === inv.id ? 'Salvando…' : 'Marcar paga'}
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
