import type React from 'react';

export type ColumnAlignment = 'left' | 'center' | 'right';

export type Column<T> = {
  key: keyof T | string;
  title: string;
  render?: (row: T) => React.ReactNode;
  priority?: number;
  align?: ColumnAlignment;
  minWidth?: number;
  sortable?: boolean;
  sortKey?: string;
};

export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
};

export type DataGridProps<T> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  sort?: Array<{ key: string; direction: 'asc' | 'desc' }>;
  onSortChange?: (sort: Array<{ key: string; direction: 'asc' | 'desc' }>) => void;
  getRowId?: (row: T) => React.Key;
  emptyState?: React.ReactNode;
  className?: string;
  rowClassName?: (row: T) => string | undefined;
};
