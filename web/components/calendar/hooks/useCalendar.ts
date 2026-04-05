"use client";

import { format, isSameMonth, startOfDay } from "date-fns";
import { useMemo } from "react";
import type { CalendarEvent, CalendarEventInstance, CalendarView } from "../types";
import { expandEventsForRange } from "../lib/expand-visible";
import { layoutOverlapping } from "../lib/overlap";
import { getColumnDays, getVisibleRange } from "../lib/range";
import { clampedDayMinutes } from "../lib/day-minutes";

export type TimeGridEventLayout = {
  instance: CalendarEventInstance;
  instanceKey: string;
  startMin: number;
  endMin: number;
  column: number;
  columnCount: number;
  top: number;
  height: number;
};

export type MonthDaySummary = {
  day: Date;
  inMonth: boolean;
  events: CalendarEventInstance[];
};

export function useCalendar(
  events: CalendarEvent[],
  view: CalendarView,
  date: Date,
  options: {
    weekStartsOn: 0 | 1;
    hourStart: number;
    hourEnd: number;
    slotMinutes: number;
    pixelsPerHour: number;
  },
) {
  const {
    weekStartsOn,
    hourStart,
    hourEnd,
    slotMinutes,
    pixelsPerHour,
  } = options;

  const gridStartMin = hourStart * 60;
  const gridEndMin = hourEnd * 60;
  const pxPerMinute = pixelsPerHour / 60;
  const totalHeight = (gridEndMin - gridStartMin) * pxPerMinute;

  const range = useMemo(
    () => getVisibleRange(date, view, weekStartsOn),
    [date, view, weekStartsOn],
  );

  const columnDays = useMemo(
    () => getColumnDays(date, view, weekStartsOn),
    [date, view, weekStartsOn],
  );

  const instances = useMemo(
    () => expandEventsForRange(events, range.start, range.end),
    [events, range.start, range.end],
  );

  const laidOutByDay = useMemo(() => {
    const map = new Map<string, TimeGridEventLayout[]>();
    if (view === "month") {
      return map;
    }
    for (const day of columnDays) {
      const key = format(startOfDay(day), "yyyy-MM-dd");
      const dayInstances = instances.filter(
        (ev) => format(startOfDay(ev.start), "yyyy-MM-dd") === key,
      );
      const intervals = dayInstances
        .map((ev) => {
          const { startMin, endMin } = clampedDayMinutes(
            ev.start,
            ev.end,
            day,
            gridStartMin,
            gridEndMin,
          );
          return {
            instance: ev,
            instanceKey: ev.instanceKey,
            startMin,
            endMin,
          };
        })
        .filter((x) => x.endMin > x.startMin);

      const laid = layoutOverlapping(intervals);
      const withGeom = laid.map((row) => {
        const top = (row.startMin - gridStartMin) * pxPerMinute;
        const height = (row.endMin - row.startMin) * pxPerMinute;
        return {
          ...row,
          top,
          height,
        };
      });
      map.set(key, withGeom);
    }
    return map;
  }, [
    columnDays,
    gridEndMin,
    gridStartMin,
    instances,
    pxPerMinute,
    view,
  ]);

  const earliestVisibleStartMin = useMemo(() => {
    if (view === "month") {
      return null;
    }
    let min: number | null = null;
    for (const layouts of laidOutByDay.values()) {
      for (const row of layouts) {
        if (min === null || row.startMin < min) {
          min = row.startMin;
        }
      }
    }
    return min;
  }, [laidOutByDay, view]);

  const monthSummaries = useMemo(() => {
    if (view !== "month") {
      return [];
    }
    const map = new Map<string, CalendarEventInstance[]>();
    for (const ev of instances) {
      const key = format(startOfDay(ev.start), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    const summaries: MonthDaySummary[] = columnDays.map((day) => {
      const key = format(startOfDay(day), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      return {
        day,
        inMonth: isSameMonth(day, date),
        events: list.sort((a, b) => a.start.getTime() - b.start.getTime()),
      };
    });
    return summaries;
  }, [columnDays, date, instances, view]);

  const monthRows = useMemo(() => {
    if (view !== "month") {
      return [];
    }
    const rows: MonthDaySummary[][] = [];
    for (let i = 0; i < monthSummaries.length; i += 7) {
      rows.push(monthSummaries.slice(i, i + 7));
    }
    return rows;
  }, [monthSummaries, view]);

  return {
    range,
    columnDays,
    instances,
    laidOutByDay,
    earliestVisibleStartMin,
    monthRows,
    monthSummaries,
    pxPerMinute,
    gridStartMin,
    gridEndMin,
    totalHeight,
    slotMinutes,
  };
}
