const brlFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBrlAmount(amount: number | null): string {
  if (amount === null || Number.isNaN(amount)) {
    return '';
  }
  return brlFormatter.format(amount);
}

export function digitsFromAmount(amount: number | null): string {
  if (amount === null || Number.isNaN(amount)) {
    return '';
  }
  return String(Math.round(amount * 100));
}

export function amountFromDigits(digits: string): number | null {
  const d = digits.replace(/\D/g, '');
  if (d === '') {
    return null;
  }
  const n = parseInt(d, 10);
  if (!Number.isFinite(n)) {
    return null;
  }
  return n / 100;
}

export function formatCurrencyBrl(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) {
    return '—';
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function apiPriceToNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.round(n * 100) / 100;
}
