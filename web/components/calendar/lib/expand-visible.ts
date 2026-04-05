import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  isBefore,
  max as maxDate,
  min as minDate,
  startOfDay,
} from "date-fns";
import type { CalendarEvent, CalendarEventInstance } from "../types";
import { clockToMinutes, setDayTime } from "./time";

function toInstance(
  base: CalendarEvent,
  start: Date,
  end: Date,
  instanceKey: string,
): CalendarEventInstance {
  return {
    ...base,
    recurrence: undefined,
    start,
    end,
    instanceKey,
  };
}

function fragmentTimedAcrossDays(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEventInstance[] {
  if (event.end <= rangeStart || event.start >= rangeEnd) {
    return [];
  }
  const out: CalendarEventInstance[] = [];
  let day = startOfDay(event.start);
  const last = startOfDay(event.end);
  while (!isBefore(last, day)) {
    const inRange = day >= startOfDay(rangeStart) && day <= startOfDay(rangeEnd);
    if (inRange) {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const s = maxDate([event.start, dayStart]);
      const e = minDate([event.end, dayEnd]);
      if (s < e) {
        out.push(
          toInstance(event, s, e, `${event.id}:${dayStart.toISOString()}`),
        );
      }
    }
    day = addDays(day, 1);
  }
  return out;
}

function expandWeekly(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEventInstance[] {
  const rule = event.recurrence;
  if (!rule || rule.frequency !== "weekly") {
    return fragmentTimedAcrossDays(event, rangeStart, rangeEnd);
  }

  const startM = clockToMinutes(rule.startTime);
  const endM = clockToMinutes(rule.endTime);
  const duration =
    endM > startM
      ? endM - startM
      : endM + 24 * 60 - startM;

  const days = eachDayOfInterval({
    start: startOfDay(rangeStart),
    end: startOfDay(rangeEnd),
  });

  const out: CalendarEventInstance[] = [];
  for (const d of days) {
    if (!rule.daysOfWeek.includes(d.getDay())) {
      continue;
    }
    const day0 = startOfDay(d);
    const start = setDayTime(day0, startM);
    let end = new Date(start.getTime() + duration * 60 * 1000);
    if (end <= start) {
      end = addDays(end, 1);
    }
    if (end > rangeStart && start < rangeEnd) {
      const clipStart = maxDate([start, rangeStart]);
      const clipEnd = minDate([end, rangeEnd]);
      if (clipStart < clipEnd) {
        out.push(
          toInstance(
            event,
            clipStart,
            clipEnd,
            `${event.id}:${day0.toISOString()}`,
          ),
        );
      }
    }
  }
  return out;
}

export function expandEventsForRange(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEventInstance[] {
  const all: CalendarEventInstance[] = [];
  for (const ev of events) {
    if (ev.recurrence) {
      all.push(...expandWeekly(ev, rangeStart, rangeEnd));
    } else {
      all.push(...fragmentTimedAcrossDays(ev, rangeStart, rangeEnd));
    }
  }
  return all;
}
