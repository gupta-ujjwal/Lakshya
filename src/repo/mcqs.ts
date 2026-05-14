import { db, type McqLogRecord } from "@/db";
import { addDaysToKey, today } from "@/lib/dates";

const WINDOW_DAYS = 7;

export async function getTodayCount(): Promise<number> {
  const row = await db.mcqLogs.get(today());
  return row?.count ?? 0;
}

export async function setTodayCount(count: number): Promise<void> {
  const record: McqLogRecord = { date: today(), count: Math.max(0, count) };
  await db.mcqLogs.put(record);
}

// Append a batch (e.g. "I just finished a 50-question test") onto
// today's running total. Read-then-write inside an `rw` transaction so
// two near-simultaneous taps can't both read the same starting value
// and lose an increment. Non-positive deltas are no-ops.
export async function addToTodayCount(delta: number): Promise<void> {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const key = today();
  await db.transaction("rw", db.mcqLogs, async () => {
    const current = (await db.mcqLogs.get(key))?.count ?? 0;
    await db.mcqLogs.put({ date: key, count: current + Math.floor(delta) });
  });
}

// Missing days count as 0 so a single-MCQ day doesn't inflate the
// average by leaving prior days out of the denominator.
export async function getLast7DayAverage(): Promise<number> {
  const todayKey = today();
  const dates = Array.from({ length: WINDOW_DAYS }, (_, i) =>
    addDaysToKey(todayKey, -(WINDOW_DAYS - 1 - i)),
  );
  const rows = await db.mcqLogs.bulkGet(dates);
  const total = rows.reduce((sum, row) => sum + (row?.count ?? 0), 0);
  return Math.round(total / WINDOW_DAYS);
}
