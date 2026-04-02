import * as React from 'react';

import type { Column } from './types';

function normalizePriority(priority?: number): number {
  return typeof priority === 'number' && Number.isFinite(priority) ? priority : 999;
}

function minWidthForColumn<T>(col: Column<T>) {
  if (typeof col.width === 'number' && Number.isFinite(col.width) && col.width > 0) {
    return Math.trunc(col.width);
  }
  if (typeof col.minWidth === 'number' && Number.isFinite(col.minWidth) && col.minWidth > 0) {
    return Math.trunc(col.minWidth);
  }
  const p = normalizePriority(col.priority);
  if (p <= 1) return 240;
  if (p <= 2) return 200;
  return 180;
}

export function useContainerWidth<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const next = Math.floor(entry.contentRect.width);
      setWidth(prev => (prev === next ? prev : next));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width } as const;
}

export function useColumnVisibility<T>(columns: Column<T>[], containerWidth: number | null) {
  const sorted = React.useMemo(() => {
    return [...columns].sort(
      (a, b) => normalizePriority(a.priority) - normalizePriority(b.priority),
    );
  }, [columns]);

  return React.useMemo(() => {
    if (containerWidth === null) {
      return { visible: sorted, hidden: [] as Column<T>[] };
    }

    const GAP = 12;
    const EXPANDER = 44;
    const PADDING = 32;

    let visible = [...sorted];
    let hidden: Column<T>[] = [];

    const minRequired = (cols: Column<T>[]) => {
      const totalCols = cols.reduce((acc, c) => acc + minWidthForColumn(c), 0);
      const gaps = Math.max(0, cols.length - 1) * GAP;
      return EXPANDER + PADDING + totalCols + gaps;
    };

    while (visible.length > 1 && minRequired(visible) > containerWidth) {
      const removed = visible.pop();
      if (removed) hidden = [removed, ...hidden];
    }

    if (visible.length === 0) {
      visible = sorted.slice(0, 1);
      hidden = sorted.slice(1);
    }

    return { visible, hidden };
  }, [containerWidth, sorted]);
}
