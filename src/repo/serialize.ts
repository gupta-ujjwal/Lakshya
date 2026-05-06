import { z } from "zod";
import { db } from "@/db";
import type {
  ScheduleRecord,
  TaskRecord,
  SessionRecord,
  TaskProgressRecord,
} from "@/db";

export const EXPORT_VERSION = 1;

// When bumping EXPORT_VERSION, add a per-version migration branch in
// parsePayload before bulkAdd. Do not add new tables to importAll
// without incrementing the version — bulkAdd of an unknown table
// would silently no-op.
const ExportPayloadSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.string().optional(),
  schedules: z.array(z.unknown()),
  tasks: z.array(z.unknown()),
  taskProgress: z.array(z.unknown()),
  sessions: z.array(z.unknown()),
});

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
  if (raw === null || typeof raw !== "object") {
    throw new Error("Invalid export: not an object");
  }
  const versioned = raw as { version?: unknown };
  if (versioned.version !== undefined && versioned.version !== EXPORT_VERSION) {
    throw new Error(
      `Unsupported export version ${String(versioned.version)} (expected ${EXPORT_VERSION})`,
    );
  }
  const result = ExportPayloadSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid export: missing required collections (${result.error.issues
        .map((i) => i.path.join(".") || "root")
        .join(", ")})`,
    );
  }
  return {
    version: EXPORT_VERSION,
    exportedAt: result.data.exportedAt ?? new Date().toISOString(),
    schedules: result.data.schedules as ScheduleRecord[],
    tasks: result.data.tasks as TaskRecord[],
    taskProgress: result.data.taskProgress as TaskProgressRecord[],
    sessions: result.data.sessions as SessionRecord[],
  };
}
