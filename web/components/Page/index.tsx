import { ListFilter } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { DataGrid } from '@/components/DataGrid';

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

const pageFiltersSearchClassName =
  'border-border text-foreground placeholder:text-placeholder min-h-11 w-full max-w-md min-w-[min(100%,12rem)] shrink-0 rounded-control border bg-card px-3.5 py-2 text-sm outline-none focus:border-primary/55 focus:ring-2 focus:ring-primary/25 sm:w-auto sm:min-w-56 sm:flex-1';

const pageFiltersDrawerTriggerClassName =
  'text-foreground inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-control border border-border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent sm:min-h-10';

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
      <h1 className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center justify-center rounded-control bg-linear-to-br from-primary to-primary-end px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 sm:min-h-10"
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
        'bg-card flex w-full shrink-0 flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3',
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
      <ListFilter className="text-muted h-4 w-4" aria-hidden />
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
