// All "today"-keyed reads/writes (TaskProgress.date, dashboard adherence
// window, session pick) bucket through these helpers. They round to UTC
// midnight so a server in any timezone produces the same calendar day, and
// `addDays` advances by 24h via timestamp arithmetic — DST-safe even in
// regions where local "next day" is 23h or 25h away.

const MS_PER_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function nextDay(date: Date): Date {
  return addDays(date, 1);
}
