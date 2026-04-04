export function parseWeekdaysFromApi(s: string): number[] {
  try {
    const a = JSON.parse(s) as unknown;
    if (!Array.isArray(a)) return [];
    const nums = a.map((x) => Number(x)).filter((n) => n >= 0 && n <= 6 && Number.isInteger(n));

    return [...new Set(nums)].sort((x, y) => x - y);
  } catch {
    return [];
  }
}
