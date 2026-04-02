'use client';

import { Loader2, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/cn';

const inputClass =
  'border-ematricula-border-input text-ematricula-text-primary placeholder:text-ematricula-text-placeholder min-h-11 w-full min-w-0 rounded-(--ematricula-radius-control) border bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/25';

export type SearchSelectProps<T> = {
  value: T | null;
  onChange: (next: T | null) => void;
  onSearch: (term: string) => Promise<T[]>;
  getOptionLabel: (item: T) => string;
  getOptionValue: (item: T) => string | number;
  placeholder?: string;
  debounceTime?: number;
  minSearchLength?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
};

export function SearchSelect<T>({
  value,
  onChange,
  onSearch,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Buscar…',
  debounceTime = 300,
  minSearchLength = 1,
  disabled = false,
  id: idProp,
  className,
  'aria-label': ariaLabel,
}: SearchSelectProps<T>) {
  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const inputId = idProp ?? `${reactId}-input`;

  const rootRef = useRef<HTMLDivElement>(null);
  const onSearchRef = useRef(onSearch);
  const getOptionLabelRef = useRef(getOptionLabel);
  const getOptionValueRef = useRef(getOptionValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() =>
    value ? getOptionLabel(value) : '',
  );
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [lastQuery, setLastQuery] = useState('');

  useLayoutEffect(() => {
    onSearchRef.current = onSearch;
    getOptionLabelRef.current = getOptionLabel;
    getOptionValueRef.current = getOptionValue;
  }, [onSearch, getOptionLabel, getOptionValue]);

  useEffect(() => {
    setInputValue(value ? getOptionLabelRef.current(value) : '');
  }, [value]);

  useEffect(() => {
    setHighlightedIndex((i) => {
      if (results.length === 0) return -1;
      if (i >= results.length) return 0;
      return i;
    });
  }, [results]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const el = e.target;
      if (!(el instanceof Node)) return;
      if (rootRef.current?.contains(el)) return;
      setOpen(false);
      setHighlightedIndex(-1);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    setLastQuery(q);
    if (q.length < minSearchLength) {
      setResults([]);
      setLoading(false);
      return;
    }
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await onSearchRef.current(q);
      if (requestIdRef.current !== myId) return;
      setResults(data);
    } catch {
      if (requestIdRef.current !== myId) return;
      setResults([]);
    } finally {
      if (requestIdRef.current === myId) setLoading(false);
    }
  }, [minSearchLength]);

  const scheduleSearch = useCallback(
    (raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void runSearch(raw);
      }, debounceTime);
    },
    [debounceTime, runSearch],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setInputValue(next);
      setOpen(true);
      setHighlightedIndex(-1);
      const t = next.trim();
      if (t.length < minSearchLength) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setResults([]);
        setLoading(false);
        setLastQuery('');
        return;
      }
      setLoading(true);
      scheduleSearch(next);
    },
    [minSearchLength, scheduleSearch],
  );

  const selectItem = useCallback(
    (item: T) => {
      onChange(item);
      setInputValue(getOptionLabelRef.current(item));
      setOpen(false);
      setResults([]);
      setHighlightedIndex(-1);
      setLastQuery('');
      setLoading(false);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setInputValue('');
    setResults([]);
    setHighlightedIndex(-1);
    setLastQuery('');
    setLoading(false);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setOpen(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
        return;
      }
      if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        setOpen(true);
      }
      if (!open || results.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const pick =
          highlightedIndex >= 0 && highlightedIndex < results.length
            ? results[highlightedIndex]
            : results[0];
        if (pick !== undefined) selectItem(pick);
      }
    },
    [open, results, highlightedIndex, selectItem],
  );

  const showList = open && !disabled;
  const trimmedInput = inputValue.trim();
  const showEmpty =
    showList &&
    !loading &&
    trimmedInput.length >= minSearchLength &&
    lastQuery === trimmedInput &&
    results.length === 0;
  const showHint =
    showList &&
    !loading &&
    trimmedInput.length < minSearchLength &&
    results.length === 0;

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <div className="flex items-stretch gap-1">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          role="combobox"
          className={cn(inputClass, disabled && 'cursor-not-allowed opacity-50')}
        />
        {value && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-(--ematricula-radius-control) border border-ematricula-border-input bg-white px-2 text-ematricula-text-muted transition-colors hover:bg-slate-50 hover:text-ematricula-text-primary"
            aria-label="Limpar seleção"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {showList ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-(--ematricula-radius-control) border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 text-sm text-ematricula-text-muted">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Buscando…
            </div>
          ) : null}
          {!loading && showHint ? (
            <div className="px-3.5 py-2.5 text-sm text-ematricula-text-muted">
              Digite para buscar
            </div>
          ) : null}
          {!loading && showEmpty ? (
            <div className="px-3.5 py-2.5 text-sm text-ematricula-text-muted">
              Nenhum resultado encontrado
            </div>
          ) : null}
          {!loading
            ? results.map((item, index) => {
                const label = getOptionLabel(item);
                const selected =
                  value !== null &&
                  getOptionValue(item) === getOptionValue(value);
                const active = index === highlightedIndex;
                return (
                  <button
                    key={String(getOptionValue(item))}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    id={`${listboxId}-opt-${index}`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectItem(item)}
                    className={cn(
                      'flex w-full cursor-pointer px-3.5 py-2 text-left text-sm text-ematricula-text-primary',
                      active ? 'bg-slate-100' : 'hover:bg-slate-50',
                    )}
                  >
                    {label}
                  </button>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
