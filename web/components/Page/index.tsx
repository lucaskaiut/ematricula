import { ListFilter } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { DataGrid } from '@/components/DataGrid';

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

const pageFiltersSearchClassName =
  'border-ematricula-border-input text-ematricula-text-primary placeholder:text-ematricula-text-placeholder min-h-11 w-full max-w-md min-w-[min(100%,12rem)] shrink-0 rounded-(--ematricula-radius-control) border bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/25 sm:w-auto sm:min-w-56 sm:flex-1';

const pageFiltersDrawerTriggerClassName =
  'text-ematricula-text-primary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-(--ematricula-radius-control) border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 sm:min-h-10';

type PageRootProps = {
  children: ReactNode;
  className?: string;
};

function PageRoot({ children, className }: PageRootProps) {
  return (
    <div className={cx('flex min-h-0 flex-1 flex-col p-4', className)}>
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  href: string;
  children: ReactNode;
  className?: string;
};

function PageHeader({ title, href, children, className }: PageHeaderProps) {
  return (
    <div
      className={cx(
        'mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <h1 className="text-ematricula-text-primary text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center justify-center rounded-(--ematricula-radius-control) bg-linear-to-br from-(--ematricula-cta-gradient-from) to-(--ematricula-cta-gradient-to) px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95 sm:min-h-10"
      >
        {children}
      </Link>
    </div>
  );
}

type PageFiltersProps = {
  children: ReactNode;
  className?: string;
};

function PageFilters({ children, className }: PageFiltersProps) {
  return (
    <div
      className={cx(
        'bg-ematricula-surface flex w-full shrink-0 flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageFiltersControlsProps = {
  children: ReactNode;
  className?: string;
};

function PageFiltersControls({ children, className }: PageFiltersControlsProps) {
  return (
    <div className={cx('flex min-w-0 flex-1 flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  );
}

type PageFiltersSearchProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  type?: ComponentPropsWithoutRef<'input'>['type'];
};

const PageFiltersSearch = forwardRef<HTMLInputElement, PageFiltersSearchProps>(
  function PageFiltersSearch({ className, type = 'search', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cx(pageFiltersSearchClassName, className)}
        {...props}
      />
    );
  },
);

type PageFiltersDrawerTriggerProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

function PageFiltersDrawerTrigger({
  onClick,
  label = 'Filtros',
  className,
}: PageFiltersDrawerTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(pageFiltersDrawerTriggerClassName, className)}
    >
      <ListFilter className="text-ematricula-text-muted h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

type PageListProps = {
  children: ReactNode;
  className?: string;
  dataGridClassName?: string;
  maxHeightClassName?: string;
};

function PageList({ children, className, dataGridClassName, maxHeightClassName }: PageListProps) {
  return (
    <div className={cx('flex min-h-0 flex-1 flex-col', className)}>
      <DataGrid.Root
        className={cx('min-h-0', dataGridClassName)}
        maxHeightClassName={maxHeightClassName ?? 'max-h-[calc(100dvh-18rem)]'}
      >
        {children}
      </DataGrid.Root>
    </div>
  );
}

type PageGridProps = {
  children: ReactNode;
  className?: string;
};

function PageGrid({ children, className }: PageGridProps) {
  return (
    <div className={cx('flex min-h-0 flex-1 flex-col', className)}>
      {children}
    </div>
  );
}

export const Page = {
  Root: PageRoot,
  Header: PageHeader,
  Filters: PageFilters,
  FiltersControls: PageFiltersControls,
  FiltersSearch: PageFiltersSearch,
  FiltersDrawerTrigger: PageFiltersDrawerTrigger,
  List: PageList,
  Grid: PageGrid,
} as const;
