import type { CalendarEvent, CalendarEventInstance } from "../types";

export function toCalendarEventPayload(
  instance: CalendarEventInstance,
): CalendarEvent {
  return {
    id: instance.id,
    title: instance.title,
    start: instance.start,
    end: instance.end,
    recurrence: instance.recurrence,
  };
}
