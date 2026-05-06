// Day-keyed reads/writes (TaskProgress.date, dashboard adherence window,
// session pick) all bucket through these helpers. ISO date strings
// (YYYY-MM-DD) are the storage form; `today()` returns one in UTC so the
// same calendar day is produced regardless of the device's local timezone.

const MS_PER_DAY = 86_400_000;

export function today(): string {
  return toDateKey(new Date());
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDaysToKey(key: string, days: number): string {
  return toDateKey(new Date(fromDateKey(key).getTime() + days * MS_PER_DAY));
}
