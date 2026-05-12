import { z } from "zod";
import { db, type McqLogRecord } from "@/db";
import { addDaysToKey, today } from "@/lib/dates";

// Single-field record — kept inline here rather than in src/domain/
// because there are no invariants worth a separate module: count is a
// non-negative integer, the date is the natural identity.
export const McqLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(0),
});

const WINDOW_DAYS = 7;

export async function getTodayCount(): Promise<number> {
  const row = await db.mcqLogs.get(today());
  return row?.count ?? 0;
}

export async function setTodayCount(count: number): Promise<void> {
  const record: McqLogRecord = { date: today(), count: Math.max(0, count) };
  await db.mcqLogs.put(record);
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
