import { clampMinutes, snapMinutes } from "./time";

export function yToMinutes(
  offsetY: number,
  pxPerMinute: number,
  gridStartMin: number,
  gridEndMin: number,
  slotMinutes: number,
): number {
  const raw = gridStartMin + offsetY / pxPerMinute;
  const snapped = snapMinutes(raw, slotMinutes);
  return clampMinutes(snapped, gridStartMin, gridEndMin);
}
