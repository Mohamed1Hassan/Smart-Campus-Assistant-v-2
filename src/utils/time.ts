export type ParsedTime = { hours: number; minutes: number };

export function parseHHMM(value: string): ParsedTime | null {
  if (!/^[0-2]?\d:[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":").map((v) => parseInt(v, 10));
  if (h > 23) return null;
  return { hours: h, minutes: m };
}

export function formatTo12h({ hours, minutes }: ParsedTime): string {
  const am = hours < 12;
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${h12}:${mm} ${am ? "AM" : "PM"}`;
}

export function toMinutes({ hours, minutes }: ParsedTime): number {
  return hours * 60 + minutes;
}

export function durationLabel(start: ParsedTime, end: ParsedTime): string {
  const diff = toMinutes(end) - toMinutes(start);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  const parts = [] as string[];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length ? parts.join(" ") : "0m";
}

export function isValidRange(startStr: string, endStr: string): boolean {
  const s = parseHHMM(startStr);
  const e = parseHHMM(endStr);
  if (!s || !e) return false;
  return toMinutes(e) > toMinutes(s);
}

export function computeStatus(
  dayOfWeek: number,
  startStr: string,
  endStr: string,
  now = new Date(),
): "upcoming" | "ongoing" | "completed" {
  const s = parseHHMM(startStr);
  const e = parseHHMM(endStr);
  if (!s || !e) return "upcoming";
  const today = now.getDay();
  if (dayOfWeek !== today) {
    // If day is before today, mark completed; if after, upcoming
    return dayOfWeek < today ? "completed" : "upcoming";
  }
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const startMins = toMinutes(s);
  const endMins = toMinutes(e);
  if (minutesNow < startMins) return "upcoming";
  if (minutesNow > endMins) return "completed";
  return "ongoing";
}
