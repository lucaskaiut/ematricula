export type WithInterval = {
  startMin: number;
  endMin: number;
  instanceKey: string;
};

export type LaidOut<T extends WithInterval> = T & {
  column: number;
  columnCount: number;
};

export function layoutOverlapping<T extends WithInterval>(
  events: T[],
): LaidOut<T>[] {
  if (events.length === 0) {
    return [];
  }
  const sorted = [...events].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin,
  );
  const active: { endMin: number; col: number }[] = [];
  const colByKey = new Map<string, number>();

  for (const ev of sorted) {
    active.sort((a, b) => a.endMin - b.endMin);
    while (active.length && active[0].endMin <= ev.startMin) {
      active.shift();
    }
    const used = new Set(active.map((a) => a.col));
    let col = 0;
    while (used.has(col)) {
      col += 1;
    }
    active.push({ endMin: ev.endMin, col });
    colByKey.set(ev.instanceKey, col);
  }

  return sorted.map((ev) => {
    const overlapping = sorted.filter(
      (o) => o.startMin < ev.endMin && o.endMin > ev.startMin,
    );
    const columnCount =
      Math.max(...overlapping.map((o) => colByKey.get(o.instanceKey) ?? 0)) + 1;
    return {
      ...ev,
      column: colByKey.get(ev.instanceKey) ?? 0,
      columnCount,
    };
  });
}
