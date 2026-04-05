import { startOfDay } from "date-fns";
import { clampMinutes } from "./time";

export function minutesFromDayStart(ev: Date, day: Date): number {
  const d0 = startOfDay(day).getTime();
  return (ev.getTime() - d0) / 60000;
}

export function clampedDayMinutes(
  start: Date,
  end: Date,
  day: Date,
  gridStartMin: number,
  gridEndMin: number,
): { startMin: number; endMin: number } {
  let startMin = minutesFromDayStart(start, day);
  let endMin = minutesFromDayStart(end, day);
  startMin = clampMinutes(startMin, gridStartMin, gridEndMin);
  endMin = clampMinutes(endMin, gridStartMin, gridEndMin);
  if (endMin < startMin) {
    endMin = startMin;
  }
  return { startMin, endMin };
}
