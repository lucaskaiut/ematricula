"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import type { CalendarEventInstance } from "./types";

export type EventDragMeta = {
  startMin: number;
  durationMin: number;
  dayStart: Date;
  pxPerMinute: number;
  gridStartMin: number;
  gridEndMin: number;
  slotMinutes: number;
};

type CalendarEventCardProps = {
  instance: CalendarEventInstance;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
  disabled?: boolean;
  dragMeta: EventDragMeta;
  onResizeStart?: (
    edge: "start" | "end",
    instance: CalendarEventInstance,
    e: React.PointerEvent,
  ) => void;
};

export function CalendarEventCard({
  instance,
  top,
  height,
  leftPct,
  widthPct,
  disabled,
  dragMeta,
  onResizeStart,
}: CalendarEventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: instance.instanceKey,
      disabled,
      data: {
        kind: "event" as const,
        instance,
        dragMeta,
      },
    });

  const style: React.CSSProperties = {
    top,
    height: Math.max(height, 28),
    left: `${leftPct}%`,
    width: `${widthPct}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 30 : 20,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "absolute box-border overflow-hidden rounded-lg border border-border/80 bg-primary px-2 py-1 text-left shadow-sm transition-[box-shadow,opacity]",
        isDragging && "cursor-grabbing opacity-90 shadow-md ring-2 ring-primary/25",
        !isDragging && !disabled && "cursor-grab",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-1 top-2 bottom-2 z-[1] rounded-md",
          !disabled && "touch-none",
        )}
        {...(!disabled ? listeners : {})}
        {...attributes}
      />
      <p className="pointer-events-none relative z-[2] line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
        {instance.title}
      </p>
      <p className="pointer-events-none relative z-[2] mt-0.5 text-[10px] tabular-nums text-foreground">
        {formatRange(instance)}
      </p>
      {onResizeStart ? (
        <>
          <div
            className="absolute left-1 right-1 top-0 z-[3] h-2.5 cursor-ns-resize rounded-t-md hover:bg-primary/10"
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart("start", instance, e);
            }}
          />
          <div
            className="absolute bottom-0 left-1 right-1 z-[3] h-2.5 cursor-ns-resize rounded-b-md hover:bg-primary/10"
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart("end", instance, e);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function formatRange(instance: CalendarEventInstance): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${instance.start.toLocaleTimeString(undefined, opts)} – ${instance.end.toLocaleTimeString(undefined, opts)}`;
}
