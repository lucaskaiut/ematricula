'use client';

import { useEffect, useState } from 'react';

import {
  amountFromDigits,
  digitsFromAmount,
  formatBrlAmount,
} from '@/lib/currency-brl';

const inputClass =
  'mt-1.5 w-full min-h-11 rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-input outline-none transition-[box-shadow,border-color] placeholder:text-placeholder focus:border-primary/55 focus:ring-2 focus:ring-primary/25';

const labelClass = 'text-sm font-medium text-secondary';

export type BrlPriceFieldProps = {
  id: string;
  label: React.ReactNode;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  optional?: boolean;
  error?: string;
  'aria-invalid'?: boolean;
};

export function BrlPriceField({
  id,
  label,
  value,
  onChange,
  disabled,
  optional,
  error,
  'aria-invalid': ariaInvalid,
}: BrlPriceFieldProps) {
  const [focused, setFocused] = useState(false);
  const [digits, setDigits] = useState(() => digitsFromAmount(value));

  useEffect(() => {
    if (!focused) {
      setDigits(digitsFromAmount(value));
    }
  }, [value, focused]);

  const displayValue = focused
    ? formatBrlAmount(amountFromDigits(digits))
    : value === null || Number.isNaN(value)
      ? ''
      : formatBrlAmount(value);

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}{' '}
        {optional ? (
          <span className="font-normal text-muted">(opcional)</span>
        ) : null}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="R$ 0,00"
        disabled={disabled}
        className={inputClass}
        aria-invalid={ariaInvalid}
        value={displayValue}
        onFocus={() => {
          setFocused(true);
          setDigits(digitsFromAmount(value));
        }}
        onBlur={() => {
          setFocused(false);
        }}
        onChange={(e) => {
          const nextDigits = e.target.value.replace(/\D/g, '');
          setDigits(nextDigits);
          onChange(amountFromDigits(nextDigits));
        }}
      />
      {error ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
