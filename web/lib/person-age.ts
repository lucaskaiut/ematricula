import { isAfter, parseISO, startOfDay, subYears } from 'date-fns';

export function personIsMinorFromIsoDate(birthDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return false;
  }
  const birth = startOfDay(parseISO(birthDate));
  const adultFrom = startOfDay(subYears(new Date(), 18));
  return isAfter(birth, adultFrom);
}
