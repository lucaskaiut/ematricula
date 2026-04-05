import type { CalendarEvent } from "@/components/calendar";
import type { ClassGroupAttributes } from "@/types/api";
import { parseWeekdaysFromApi } from "@/lib/parse-class-group-weekdays";

function normalizeClock(value: string): string {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) {
    return "09:00";
  }
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function classGroupsToCalendarEvents(
  groups: ClassGroupAttributes[],
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const g of groups) {
    const daysOfWeek = parseWeekdaysFromApi(g.weekdays);
    if (daysOfWeek.length === 0) {
      continue;
    }
    if (
      typeof g.starts_at !== "string" ||
      !g.starts_at ||
      typeof g.ends_at !== "string" ||
      !g.ends_at
    ) {
      continue;
    }
    const startTime = normalizeClock(g.starts_at);
    const endTime = normalizeClock(g.ends_at);
    const modality = g.modality?.name?.trim();
    const title = modality ? `${g.name} · ${modality}` : g.name;
    out.push({
      id: `class-group-${g.id}`,
      title,
      start: new Date(2020, 0, 5, 0, 0, 0, 0),
      end: new Date(2020, 0, 5, 1, 0, 0, 0),
      recurrence: {
        frequency: "weekly",
        daysOfWeek,
        startTime,
        endTime,
      },
    });
  }
  return out;
}
