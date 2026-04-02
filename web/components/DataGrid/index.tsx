'use client';

import { DataGridPagination } from './pagination';
import { DataGridTable } from './table';
import type { DataGridRootProps } from './types.ts';

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

export function DataGridRoot({ children, className, maxHeightClassName }: DataGridRootProps) {
  return (
    <div
      className={cx(
        'flex w-full flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-white',
        maxHeightClassName ?? 'max-h-[calc(100dvh-11rem)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export const DataGrid = {
  Root: DataGridRoot,
  Table: DataGridTable,
  Pagination: DataGridPagination,
} as const;

export { DataGridPagination } from './pagination';
export { DataGridTable } from './table';

export type {
  Column,
  DataGridPaginationProps,
  DataGridRootProps,
  DataGridTableProps,
  PaginationMeta,
} from './types.ts';
