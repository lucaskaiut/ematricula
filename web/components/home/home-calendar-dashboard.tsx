"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays, startOfWeek } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/calendar";
import type { CalendarView } from "@/components/calendar";
import type { ApiResponse } from "@/lib/api";
import { classGroupsToCalendarEvents } from "@/lib/class-groups-to-calendar-events";
import type { ClassGroupAttributes } from "@/types/api";

export function HomeCalendarDashboard() {
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [date, setDate] = useState(() => new Date());

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["class-groups", "home-dashboard"],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set("per_page", "500");
      p.append("orderBy[name]", "asc");
      const res = await fetch(`/api/class-groups?${p}`);
      if (!res.ok) {
        throw new Error("Falha ao carregar turmas");
      }
      return (await res.json()) as ApiResponse<ClassGroupAttributes[]>;
    },
  });

  const events = useMemo(
    () => classGroupsToCalendarEvents(data?.data ?? []),
    [data?.data],
  );

  const rangeLabel = useMemo(() => {
    if (calendarView === "day") {
      return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (calendarView === "week") {
      const w0 = startOfWeek(date, { weekStartsOn: 0 });
      const w1 = addDays(w0, 6);
      return `${w0.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} – ${w1.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [date, calendarView]);

  return (
    <section className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Agenda de aulas
          </h2>
          <p className="mt-1 max-w-prose text-sm text-secondary">
            Horários das turmas cadastradas.{" "}
            <Link
              href="/class-groups"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Gerenciar turmas
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
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
      </div>

      <p className="text-sm capitalize text-muted">{rangeLabel}</p>

      {isPending ? (
        <div
          className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border/60 bg-card/80 text-sm text-muted"
          role="status"
        >
          Carregando turmas…
        </div>
      ) : null}

      {isError ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error instanceof Error ? error.message : "Não foi possível carregar as turmas."}
        </div>
      ) : null}

      {!isPending && !isError && events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card-subtle/40 px-4 py-10 text-center text-sm text-secondary">
          <p>Nenhuma turma com dias e horários definidos.</p>
          <Link
            href="/class-groups/new"
            className="mt-3 inline-block font-medium text-primary underline-offset-2 hover:underline"
          >
            Cadastrar turma
          </Link>
        </div>
      ) : null}

      {!isPending && !isError && events.length > 0 ? (
        <Calendar
          events={events}
          date={date}
          onViewChange={setCalendarView}
          viewportAdaptive
          weekStartsOn={0}
        />
      ) : null}
    </section>
  );
}
