"use client";

import { useDroppable } from "@dnd-kit/core";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { CalendarEventCard } from "./calendar-event";
import type { TimeGridEventLayout } from "./hooks/useCalendar";
import type { CalendarEventInstance } from "./types";

export type CalendarGridProps = {
  days: Date[];
  totalHeight: number;
  gridStartMin: number;
  gridEndMin: number;
  pxPerMinute: number;
  slotMinutes: number;
  laidOutByDay: Map<string, TimeGridEventLayout[]>;
  autoScrollAnchorMin?: number | null;
  autoScrollKey?: number | null;
  onCreateSlot?: (day: Date, minutes: number) => void;
  onResizeStart?: (
    edge: "start" | "end",
    instance: CalendarEventInstance,
    e: React.PointerEvent,
  ) => void;
  dragDisabled?: boolean;
  showResize?: boolean;
};

const AUTO_SCROLL_TOP_PADDING_PX = 28;

export function CalendarGrid({
  days,
  totalHeight,
  gridStartMin,
  gridEndMin,
  pxPerMinute,
  slotMinutes,
  laidOutByDay,
  autoScrollAnchorMin = null,
  autoScrollKey = null,
  onCreateSlot,
  onResizeStart,
  dragDisabled,
  showResize,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || autoScrollKey === null) {
      return;
    }
    if (autoScrollAnchorMin === null) {
      el.scrollTop = 0;
      return;
    }
    const eventTop =
      (autoScrollAnchorMin - gridStartMin) * pxPerMinute;
    const slotPx = slotMinutes * pxPerMinute;
    const padding = Math.max(AUTO_SCROLL_TOP_PADDING_PX, slotPx * 0.5);
    const target = Math.max(0, eventTop - padding);
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    el.scrollTop = Math.min(target, maxScroll);
  }, [
    autoScrollAnchorMin,
    autoScrollKey,
    gridStartMin,
    pxPerMinute,
    slotMinutes,
    totalHeight,
  ]);

  const hourStart = Math.floor(gridStartMin / 60);
  const hourEnd = Math.ceil(gridEndMin / 60);
  const hours: number[] = [];
  for (let h = hourStart; h < hourEnd; h += 1) {
    hours.push(h);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex shrink-0 border-b border-border/50 bg-card-subtle/40">
        <div
          className="w-12 shrink-0 sm:w-14"
          aria-hidden
        />
        {days.map((day) => {
          const key = format(startOfDay(day), "yyyy-MM-dd");
          return (
            <div
              key={key}
              className="min-w-0 flex-1 border-l border-border/50 px-1 py-2 text-center first:border-l-0 sm:px-2"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted sm:text-[11px]">
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-sm font-semibold tabular-nums text-foreground sm:text-base",
                  format(day, "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd") && "text-primary",
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          );
        })}
      </div>
      <div
        ref={scrollRef}
        className="flex min-h-0 max-h-[min(72vh,880px)] flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="flex min-h-max w-full min-w-0">
          <div
            className="sticky left-0 z-20 w-12 shrink-0 self-start border-r border-border/60 bg-card-subtle/90 py-2 text-[10px] font-medium tabular-nums text-muted backdrop-blur-sm sm:w-14 sm:text-[11px]"
            aria-hidden
          >
            <div style={{ height: totalHeight }} className="relative">
              {hours.map((h) => {
                const top = (h * 60 - gridStartMin) * pxPerMinute;
                return (
                  <div
                    key={h}
                    className="absolute right-1 -translate-y-1/2 text-right"
                    style={{ top }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 divide-x divide-border/50">
            {days.map((day) => {
              const key = format(startOfDay(day), "yyyy-MM-dd");
              const items = laidOutByDay.get(key) ?? [];
              return (
                <DayBody
                  key={key}
                  day={day}
                  totalHeight={totalHeight}
                  gridStartMin={gridStartMin}
                  gridEndMin={gridEndMin}
                  pxPerMinute={pxPerMinute}
                  slotMinutes={slotMinutes}
                  hours={hours}
                  items={items}
                  onCreateSlot={onCreateSlot}
                  onResizeStart={onResizeStart}
                  dragDisabled={dragDisabled}
                  showResize={showResize}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

type DayBodyProps = {
  day: Date;
  totalHeight: number;
  gridStartMin: number;
  gridEndMin: number;
  pxPerMinute: number;
  slotMinutes: number;
  hours: number[];
  items: TimeGridEventLayout[];
  onCreateSlot?: (day: Date, minutes: number) => void;
  onResizeStart?: (
    edge: "start" | "end",
    instance: CalendarEventInstance,
    e: React.PointerEvent,
  ) => void;
  dragDisabled?: boolean;
  showResize?: boolean;
};

function DayBody({
  day,
  totalHeight,
  gridStartMin,
  gridEndMin,
  pxPerMinute,
  slotMinutes,
  hours,
  items,
  onCreateSlot,
  onResizeStart,
  dragDisabled,
  showResize,
}: DayBodyProps) {
  const day0 = startOfDay(day);
  const droppableId = `cal-day-${format(day0, "yyyy-MM-dd")}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      kind: "day" as const,
      dayStart: day0,
    },
  });

  return (
    <div className="min-w-0 flex-1">
      <div
        ref={setNodeRef}
        style={{ height: totalHeight }}
        className={cn("relative", isOver && "bg-accent-soft/35")}
      >
        {onCreateSlot ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Criar evento neste horário"
            className="absolute inset-0 z-0 cursor-cell bg-transparent"
            onClick={(e) => {
              const offsetY = e.nativeEvent.offsetY;
              const rawMin = gridStartMin + offsetY / pxPerMinute;
              const snapped =
                Math.round(rawMin / slotMinutes) * slotMinutes;
              const clamped = Math.min(
                gridEndMin - slotMinutes,
                Math.max(gridStartMin, snapped),
              );
              onCreateSlot(day0, clamped);
            }}
          />
        ) : null}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
        >
          {hours.map((h) => {
            const top = (h * 60 - gridStartMin) * pxPerMinute;
            return (
              <div
                key={h}
                className="absolute right-0 left-0 border-t border-border/40"
                style={{ top }}
              />
            );
          })}
        </div>
        {items.map((row) => {
          const widthPct = 100 / row.columnCount;
          const leftPct = row.column * widthPct;
          const dragMeta = {
            startMin: row.startMin,
            durationMin: row.endMin - row.startMin,
            dayStart: day0,
            pxPerMinute,
            gridStartMin,
            gridEndMin,
            slotMinutes,
          };
          return (
            <CalendarEventCard
              key={row.instanceKey}
              instance={row.instance}
              top={row.top}
              height={row.height}
              leftPct={leftPct}
              widthPct={widthPct - 0.75}
              disabled={dragDisabled}
              dragMeta={dragMeta}
              onResizeStart={showResize ? onResizeStart : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
