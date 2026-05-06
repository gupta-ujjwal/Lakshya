import { db, newId, nowIso, type ScheduleRecord, type TaskRecord } from "@/db";
import { generateTasksFromSchedule } from "@/domain/ingest";
import {
  DEFAULT_HOURS_PER_DAY,
  type ImportScheduleInput,
} from "@/domain/schedule";

export interface ImportResult {
  scheduleId: string;
  taskCount: number;
}

export async function importSchedule(
  input: ImportScheduleInput,
): Promise<ImportResult> {
  const scheduleId = newId();
  const created = nowIso();
  const generated = generateTasksFromSchedule(input);

  const schedule: ScheduleRecord = {
    id: scheduleId,
    createdAt: created,
    title: input.title,
    targetDate: input.targetDate,
    data: input,
    hoursPerDay: input.hoursPerDay ?? DEFAULT_HOURS_PER_DAY,
  };

  const tasks: TaskRecord[] = generated.map((t) => ({
    id: newId(),
    createdAt: created,
    scheduleId,
    title: t.title,
    subject: t.subject,
    targetDate: t.targetDate,
    priority: t.priority,
  }));

  await db.transaction("rw", db.schedules, db.tasks, async () => {
    await db.schedules.add(schedule);
    if (tasks.length > 0) await db.tasks.bulkAdd(tasks);
  });

  return { scheduleId, taskCount: tasks.length };
}

export async function getLatestSchedule(): Promise<ScheduleRecord | null> {
  const all = await db.schedules.orderBy("createdAt").reverse().limit(1).toArray();
  return all[0] ?? null;
}
