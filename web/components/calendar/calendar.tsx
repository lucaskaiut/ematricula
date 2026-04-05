"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { startOfDay, startOfWeek } from "date-fns";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { CalendarGrid } from "./calendar-grid";
import { CalendarMonth } from "./calendar-month";
import { clampedDayMinutes } from "./lib/day-minutes";
import { yToMinutes } from "./lib/position";
import { toCalendarEventPayload } from "./lib/payload";
import {
  clampMinutes,
  setDayTime,
  snapMinutes,
} from "./lib/time";
import { useCalendar } from "./hooks/useCalendar";
import type {
  CalendarEventInstance,
  CalendarProps,
  CalendarView,
} from "./types";

const MIN_DURATION_MIN = 15;

const VIEW_OPTIONS: { id: CalendarView; label: string }[] = [
  { id: "day", label: "Dia" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
];

export function Calendar({
  events,
  view: controlledView,
  defaultView = "week",
  onViewChange,
  viewportAdaptive = false,
  viewportAdaptiveBreakpointPx = 768,
  showViewSwitcher = true,
  date,
  onCreateEvent,
  onUpdateEvent,
  hourStart = 0,
  hourEnd = 24,
  slotMinutes = 15,
  pixelsPerHour = 52,
  weekStartsOn = 0,
  autoScrollToFirstEvent = true,
}: CalendarProps) {
  const isControlled = controlledView !== undefined;
  const userViewLocked = useRef(false);
  const [internalView, setInternalView] =
    useState<CalendarView>(defaultView);
  const effectiveView = isControlled ? controlledView : internalView;

  const onViewChangeRef = useRef(onViewChange);

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  useLayoutEffect(() => {
    onViewChangeRef.current?.(effectiveView);
  }, [effectiveView]);

  useLayoutEffect(() => {
    if (!viewportAdaptive || isControlled || typeof window === "undefined") {
      return;
    }
    const mq = window.matchMedia(
      `(min-width: ${viewportAdaptiveBreakpointPx}px)`,
    );
    const apply = () => {
      if (!userViewLocked.current) {
        setInternalView(mq.matches ? "week" : "day");
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [viewportAdaptive, isControlled, viewportAdaptiveBreakpointPx]);

  const handleViewSelect = useCallback(
    (next: CalendarView) => {
      userViewLocked.current = true;
      if (isControlled) {
        onViewChange?.(next);
      } else {
        setInternalView(next);
      }
    },
    [isControlled, onViewChange],
  );

  const {
    columnDays,
    laidOutByDay,
    earliestVisibleStartMin,
    monthRows,
    pxPerMinute,
    gridStartMin,
    gridEndMin,
    totalHeight,
    slotMinutes: snapSlot,
  } = useCalendar(events, effectiveView, date, {
    weekStartsOn,
    hourStart,
    hourEnd,
    slotMinutes,
    pixelsPerHour,
  });

  const autoScrollKey = useMemo(() => {
    if (!autoScrollToFirstEvent || effectiveView === "month") {
      return null;
    }
    if (effectiveView === "day") {
      return startOfDay(date).getTime();
    }
    return startOfWeek(date, { weekStartsOn }).getTime();
  }, [autoScrollToFirstEvent, date, effectiveView, weekStartsOn]);

  const [activeDrag, setActiveDrag] = useState<CalendarEventInstance | null>(
    null,
  );
  const [resize, setResize] = useState<{
    edge: "start" | "end";
    instance: CalendarEventInstance;
    dayStart: Date;
    originMin: { startMin: number; endMin: number };
    originY: number;
    pointerId: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const d = e.active.data.current;
    if (d?.kind === "event") {
      setActiveDrag(d.instance as CalendarEventInstance);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      if (!onUpdateEvent || !event.over) {
        return;
      }
      const active = event.active.data.current;
      if (active?.kind !== "event") {
        return;
      }
      const over = event.over.data.current;
      if (over?.kind !== "day") {
        return;
      }
      const instance = active.instance as CalendarEventInstance;
      const dragMeta = active.dragMeta as
        | {
            durationMin: number;
            pxPerMinute: number;
            gridStartMin: number;
            gridEndMin: number;
            slotMinutes: number;
          }
        | undefined;
      if (!dragMeta) {
        return;
      }
      const ae = event.activatorEvent;
      const clientY =
        ae instanceof PointerEvent
          ? ae.clientY
          : ae instanceof MouseEvent
            ? ae.clientY
            : 0;
      const relY = clientY - event.over.rect.top;
      let nextStartMin = yToMinutes(
        relY,
        dragMeta.pxPerMinute,
        dragMeta.gridStartMin,
        dragMeta.gridEndMin,
        dragMeta.slotMinutes,
      );
      const dur = Math.max(MIN_DURATION_MIN, dragMeta.durationMin);
      nextStartMin = Math.min(nextStartMin, dragMeta.gridEndMin - dur);
      nextStartMin = snapMinutes(nextStartMin, dragMeta.slotMinutes);
      const dayStart = over.dayStart as Date;
      const newStart = setDayTime(dayStart, nextStartMin);
      const newEnd = new Date(newStart.getTime() + dur * 60 * 1000);
      onUpdateEvent(
        toCalendarEventPayload({
          ...instance,
          start: newStart,
          end: newEnd,
        }),
      );
    },
    [onUpdateEvent],
  );

  const handleResizeStart = useCallback(
    (
      edge: "start" | "end",
      instance: CalendarEventInstance,
      e: React.PointerEvent,
    ) => {
      if (!onUpdateEvent) {
        return;
      }
      e.preventDefault();
      const dayStart = startOfDay(instance.start);
      const { startMin, endMin } = clampedDayMinutes(
        instance.start,
        instance.end,
        dayStart,
        gridStartMin,
        gridEndMin,
      );
      setResize({
        edge,
        instance,
        dayStart,
        originMin: { startMin, endMin },
        originY: e.clientY,
        pointerId: e.pointerId,
      });
    },
    [gridEndMin, gridStartMin, onUpdateEvent],
  );

  useEffect(() => {
    if (!resize || !onUpdateEvent) {
      return;
    }
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== resize.pointerId) {
        return;
      }
      const dy = ev.clientY - resize.originY;
      const dMin = dy / pxPerMinute;
      let startMin = resize.originMin.startMin;
      let endMin = resize.originMin.endMin;
      if (resize.edge === "start") {
        startMin = snapMinutes(
          clampMinutes(
            resize.originMin.startMin + dMin,
            gridStartMin,
            resize.originMin.endMin - MIN_DURATION_MIN,
          ),
          snapSlot,
        );
      } else {
        endMin = snapMinutes(
          clampMinutes(
            resize.originMin.endMin + dMin,
            resize.originMin.startMin + MIN_DURATION_MIN,
            gridEndMin,
          ),
          snapSlot,
        );
      }
      const newStart = setDayTime(resize.dayStart, startMin);
      const newEnd = setDayTime(resize.dayStart, endMin);
      onUpdateEvent(
        toCalendarEventPayload({
          ...resize.instance,
          start: newStart,
          end: newEnd,
        }),
      );
      setResize(null);
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [
    gridEndMin,
    gridStartMin,
    onUpdateEvent,
    pxPerMinute,
    resize,
    snapSlot,
  ]);

  const viewSwitcher = showViewSwitcher ? (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="flex rounded-xl border border-border/60 bg-card p-0.5 shadow-sm">
        {VIEW_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleViewSelect(id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              effectiveView === id
                ? "bg-primary/15 text-primary"
                : "text-secondary hover:bg-accent-soft/60",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  if (effectiveView === "month") {
    return (
      <div className="flex flex-col gap-2">
        {viewSwitcher}
        <CalendarMonth
          rows={monthRows}
          onCreateDay={onCreateEvent ? (d) => onCreateEvent(d) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {viewSwitcher}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <CalendarGrid
          days={columnDays}
          totalHeight={totalHeight}
          gridStartMin={gridStartMin}
          gridEndMin={gridEndMin}
          pxPerMinute={pxPerMinute}
          slotMinutes={snapSlot}
          laidOutByDay={laidOutByDay}
          autoScrollAnchorMin={
            autoScrollToFirstEvent ? earliestVisibleStartMin : null
          }
          autoScrollKey={autoScrollKey}
          onCreateSlot={
            onCreateEvent
              ? (day0, minutes) => onCreateEvent(setDayTime(day0, minutes))
              : undefined
          }
          onResizeStart={handleResizeStart}
          dragDisabled={resize !== null || !onUpdateEvent}
          showResize={Boolean(onUpdateEvent)}
        />
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div className="min-w-[140px] max-w-[200px] rounded-xl border border-border/80 bg-card px-3 py-2 shadow-lg ring-2 ring-primary/20">
              <p className="text-xs font-semibold leading-snug text-foreground">
                {activeDrag.title}
              </p>
              <p className="mt-1 text-[10px] tabular-nums text-muted">
                {activeDrag.start.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {activeDrag.end.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
