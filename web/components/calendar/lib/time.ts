export const MINUTES_PER_DAY = 24 * 60;

export function parseClock(hm: string): { h: number; m: number } {
  const [a, b] = hm.split(":").map((x) => Number(x));
  return { h: Number.isFinite(a) ? a : 0, m: Number.isFinite(b) ? b : 0 };
}

export function clockToMinutes(hm: string): number {
  const { h, m } = parseClock(hm);
  return h * 60 + m;
}

export function getMinutesFromDate(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function setDayTime(dayStart: Date, minutes: number): Date {
  const total = Math.max(0, Math.min(MINUTES_PER_DAY - 1, Math.floor(minutes)));
  const d = new Date(dayStart);
  d.setHours(0, 0, 0, 0);
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d;
}

export function snapMinutes(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function clampMinutes(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function minutesSpan(startMin: number, endMin: number): number {
  return Math.max(0, endMin - startMin);
}
