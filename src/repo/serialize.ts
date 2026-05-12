import { z } from "zod";
import { db } from "@/db";
import type {
  McqLogRecord,
  ScheduleRecord,
  TaskRecord,
  SessionRecord,
  TaskProgressRecord,
} from "@/db";

// Wire-validation schema for incoming MCQ rows. Lives next to the
// other wire schemas (ExportPayloadSchema below) rather than in mcqs.ts
// because the repo trusts its own writes — only the import boundary
// needs per-row validation.
const McqLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(0),
});

export const EXPORT_VERSION = 2;

// When bumping EXPORT_VERSION, add a per-version migration branch in
// parsePayload before bulkAdd. Do not add new tables to importAll
// without incrementing the version — bulkAdd of an unknown table
// would silently no-op.
//
// v1 → v2: mcqLogs added (#8). v1 payloads remain importable; their
// mcqLogs collection defaults to empty so prior backups don't fail to
// restore.
const ExportPayloadSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string().optional(),
  schedules: z.array(z.unknown()),
  tasks: z.array(z.unknown()),
  taskProgress: z.array(z.unknown()),
  sessions: z.array(z.unknown()),
  mcqLogs: z.array(McqLogSchema).optional(),
});

export interface ExportPayload {
  version: number;
  exportedAt: string;
  schedules: ScheduleRecord[];
  tasks: TaskRecord[];
  taskProgress: TaskProgressRecord[];
  sessions: SessionRecord[];
  mcqLogs: McqLogRecord[];
}

export async function exportAll(): Promise<ExportPayload> {
  const [schedules, tasks, taskProgress, sessions, mcqLogs] = await Promise.all([
    db.schedules.toArray(),
    db.tasks.toArray(),
    db.taskProgress.toArray(),
    db.sessions.toArray(),
    db.mcqLogs.toArray(),
  ]);
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    schedules,
    tasks,
    taskProgress,
    sessions,
    mcqLogs,
  };
}

export async function importAll(payload: unknown): Promise<void> {
  const parsed = parsePayload(payload);
  await db.transaction(
    "rw",
    [db.schedules, db.tasks, db.taskProgress, db.sessions, db.mcqLogs],
    async () => {
      await Promise.all([
        db.schedules.clear(),
        db.tasks.clear(),
        db.taskProgress.clear(),
        db.sessions.clear(),
        db.mcqLogs.clear(),
      ]);
      await Promise.all([
        db.schedules.bulkAdd(parsed.schedules),
        db.tasks.bulkAdd(parsed.tasks),
        db.taskProgress.bulkAdd(parsed.taskProgress),
        db.sessions.bulkAdd(parsed.sessions),
        db.mcqLogs.bulkAdd(parsed.mcqLogs),
      ]);
    },
  );
}

export async function clearAll(): Promise<void> {
  await db.transaction(
    "rw",
    [db.schedules, db.tasks, db.taskProgress, db.sessions, db.mcqLogs],
    async () => {
      await Promise.all([
        db.schedules.clear(),
        db.tasks.clear(),
        db.taskProgress.clear(),
        db.sessions.clear(),
        db.mcqLogs.clear(),
      ]);
    },
  );
}

const SUPPORTED_VERSIONS = [1, 2] as const;

function parsePayload(raw: unknown): ExportPayload {
  if (raw === null || typeof raw !== "object") {
    throw new Error("Invalid export: not an object");
  }
  const versioned = raw as { version?: unknown };
  if (
    versioned.version !== undefined &&
    !SUPPORTED_VERSIONS.includes(versioned.version as 1 | 2)
  ) {
    throw new Error(
      `Unsupported export version ${String(versioned.version)} (expected ${SUPPORTED_VERSIONS.join(" or ")})`,
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
    mcqLogs: result.data.mcqLogs ?? [],
  };
}
