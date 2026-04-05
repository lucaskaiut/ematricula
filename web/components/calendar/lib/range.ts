import {
  addDays,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarView } from "../types";

export type VisibleRange = {
  start: Date;
  end: Date;
};

export function getVisibleRange(
  anchor: Date,
  view: CalendarView,
  weekStartsOn: 0 | 1,
): VisibleRange {
  if (view === "day") {
    const d0 = startOfDay(anchor);
    return { start: d0, end: addDays(d0, 1) };
  }
  if (view === "week") {
    const ws = startOfWeek(anchor, { weekStartsOn });
    const we = endOfWeek(anchor, { weekStartsOn });
    return { start: startOfDay(ws), end: addDays(startOfDay(we), 1) };
  }
  const ms = startOfMonth(anchor);
  const lastDay = startOfDay(endOfMonth(anchor));
  return { start: startOfDay(ms), end: addDays(lastDay, 1) };
}

export function getColumnDays(
  anchor: Date,
  view: CalendarView,
  weekStartsOn: 0 | 1,
): Date[] {
  if (view === "day") {
    return [startOfDay(anchor)];
  }
  if (view === "week") {
    const ws = startOfWeek(anchor, { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => addDays(startOfDay(ws), i));
  }
  const ms = startOfMonth(anchor);
  const me = endOfMonth(anchor);
  const gridStart = startOfWeek(ms, { weekStartsOn });
  const gridEnd = endOfWeek(me, { weekStartsOn });
  const days: Date[] = [];
  let d = startOfDay(gridStart);
  const end = startOfDay(addDays(gridEnd, 1));
  while (d < end) {
    days.push(d);
    d = addDays(d, 1);
  }
  return days;
}

export function monthGridRows(anchor: Date, weekStartsOn: 0 | 1): Date[][] {
  const days = getColumnDays(anchor, "month", weekStartsOn);
  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }
  return rows;
}
