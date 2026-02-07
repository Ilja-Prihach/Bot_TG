import { DateTime } from "luxon";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = TIME_RE.exec(value.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

export function nowInTimezone(timezone: string): DateTime {
  const dt = DateTime.now().setZone(timezone);
  if (!dt.isValid) {
    return DateTime.now().setZone("Europe/Minsk");
  }
  return dt;
}

export function isSameLocalDay(a: DateTime, b: DateTime): boolean {
  return a.toISODate() === b.toISODate();
}
