import { db } from "@/db";
import type { ScheduleRecord, TaskRecord, SessionRecord } from "@/db";
import type { TaskProgressRecord } from "@/domain/progress";

export const EXPORT_VERSION = 1;

export interface ExportPayload {
  version: number;
  exportedAt: string;
  schedules: ScheduleRecord[];
  tasks: TaskRecord[];
  taskProgress: TaskProgressRecord[];
  sessions: SessionRecord[];
}

export async function exportAll(): Promise<ExportPayload> {
  const [schedules, tasks, taskProgress, sessions] = await Promise.all([
    db.schedules.toArray(),
    db.tasks.toArray(),
    db.taskProgress.toArray(),
    db.sessions.toArray(),
  ]);
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    schedules,
    tasks,
    taskProgress,
    sessions,
  };
}

export async function importAll(payload: unknown): Promise<void> {
  const parsed = parsePayload(payload);
  await db.transaction(
    "rw",
    db.schedules,
    db.tasks,
    db.taskProgress,
    db.sessions,
    async () => {
      await Promise.all([
        db.schedules.clear(),
        db.tasks.clear(),
        db.taskProgress.clear(),
        db.sessions.clear(),
      ]);
      await Promise.all([
        db.schedules.bulkAdd(parsed.schedules),
        db.tasks.bulkAdd(parsed.tasks),
        db.taskProgress.bulkAdd(parsed.taskProgress),
        db.sessions.bulkAdd(parsed.sessions),
      ]);
    },
  );
}

export async function clearAll(): Promise<void> {
  await db.transaction(
    "rw",
    db.schedules,
    db.tasks,
    db.taskProgress,
    db.sessions,
    async () => {
      await Promise.all([
        db.schedules.clear(),
        db.tasks.clear(),
        db.taskProgress.clear(),
        db.sessions.clear(),
      ]);
    },
  );
}

function parsePayload(raw: unknown): ExportPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid export: not an object");
  }
  const p = raw as Partial<ExportPayload>;
  if (p.version !== EXPORT_VERSION) {
    throw new Error(
      `Unsupported export version ${String(p.version)} (expected ${EXPORT_VERSION})`,
    );
  }
  if (
    !Array.isArray(p.schedules) ||
    !Array.isArray(p.tasks) ||
    !Array.isArray(p.taskProgress) ||
    !Array.isArray(p.sessions)
  ) {
    throw new Error("Invalid export: missing required collections");
  }
  return {
    version: EXPORT_VERSION,
    exportedAt: p.exportedAt ?? new Date().toISOString(),
    schedules: p.schedules,
    tasks: p.tasks,
    taskProgress: p.taskProgress,
    sessions: p.sessions,
  };
}
