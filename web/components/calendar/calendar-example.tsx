"use client";

import { addDays, startOfWeek } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Calendar } from "./calendar";
import type { CalendarEvent, CalendarView } from "./types";

export function CalendarExample() {
  const [date, setDate] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [events, setEvents] = useState<CalendarEvent[]>(() => [
    {
      id: "1",
      title: "Reunião de planejamento",
      start: (() => {
        const d = startOfWeek(new Date(), { weekStartsOn: 0 });
        d.setHours(10, 0, 0, 0);
        return d;
      })(),
      end: (() => {
        const d = startOfWeek(new Date(), { weekStartsOn: 0 });
        d.setHours(11, 30, 0, 0);
        return d;
      })(),
    },
    {
      id: "2",
      title: "Curso: segunda e quarta",
      start: new Date(2020, 0, 1, 0, 0, 0, 0),
      end: new Date(2020, 0, 1, 1, 0, 0, 0),
      recurrence: {
        frequency: "weekly",
        daysOfWeek: [1, 3],
        startTime: "19:00",
        endTime: "20:00",
      },
    },
  ]);

  const title = useMemo(() => {
    if (calendarView === "day") {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (calendarView === "week") {
      const w0 = startOfWeek(date, { weekStartsOn: 0 });
      const w1 = addDays(w0, 6);
      return `${w0.toLocaleDateString(undefined, { day: "numeric", month: "short" })} – ${w1.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [date, calendarView]);

  const onCreateEvent = useCallback((d: Date) => {
    const start = new Date(d);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "Novo evento",
        start,
        end,
      },
    ]);
  }, []);

  const onUpdateEvent = useCallback((updated: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
    );
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Agenda
          </h2>
          <p className="text-sm capitalize text-muted">{title}</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-secondary shadow-sm hover:bg-accent-soft/50"
            onClick={() =>
              setDate((d) =>
                addDays(
                  d,
                  calendarView === "month"
                    ? -30
                    : calendarView === "week"
                      ? -7
                      : -1,
                ),
              )
            }
          >
            Anterior
          </button>
          <button
            type="button"
            className="rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-secondary shadow-sm hover:bg-accent-soft/50"
            onClick={() => setDate(new Date())}
          >
            Hoje
          </button>
          <button
            type="button"
            className="rounded-xl border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-secondary shadow-sm hover:bg-accent-soft/50"
            onClick={() =>
              setDate((d) =>
                addDays(
                  d,
                  calendarView === "month"
                    ? 30
                    : calendarView === "week"
                      ? 7
                      : 1,
                ),
              )
            }
          >
            Próximo
          </button>
        </div>
      </header>
      <Calendar
        events={events}
        date={date}
        onViewChange={setCalendarView}
        onCreateEvent={onCreateEvent}
        onUpdateEvent={onUpdateEvent}
        weekStartsOn={0}
      />
    </div>
  );
}
