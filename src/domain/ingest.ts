import { fromDateKey, toDateKey } from "@/lib/dates";
import type { ImportScheduleInput } from "./schedule";

export const MAX_DAYS = 730;

export interface GeneratedTask {
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
}

export function generateTasksFromSchedule(
  input: ImportScheduleInput,
  startDate: Date = new Date(),
): GeneratedTask[] {
  // Both sides bucket to UTC midnight (via toDateKey → fromDateKey) so the
  // day count is a calendar diff, not a sub-day timestamp diff that would
  // produce off-by-one runs.
  const start = fromDateKey(toDateKey(startDate));
  const target = fromDateKey(input.targetDate);
  if (target < start) return [];

  const msPerDay = 86_400_000;
  const totalDays = Math.min(
    Math.round((target.getTime() - start.getTime()) / msPerDay) + 1,
    MAX_DAYS,
  );
  if (totalDays <= 0 || input.timetable.length === 0) return [];

  const tasks: GeneratedTask[] = [];
  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = new Date(start.getTime() + dayOffset * msPerDay);
    const cycleDayNumber = (dayOffset % input.cycleLengthDays) + 1;
    const dayData = input.timetable.find((d) => d.dayNumber === cycleDayNumber);
    if (!dayData?.slots?.length) continue;

    dayData.slots.forEach((slot, slotIndex) => {
      tasks.push({
        title: slot.topic ?? slot.subject,
        subject: slot.subject,
        targetDate: toDateKey(currentDate),
        priority: slotIndex,
      });
    });
  }
  return tasks;
}
