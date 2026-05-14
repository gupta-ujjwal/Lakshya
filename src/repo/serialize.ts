import { z } from "zod";
import { db } from "@/db";
import type {
  McqLogRecord,
  MockTestRecord,
  ScheduleRecord,
  TaskRecord,
  SessionRecord,
  TaskProgressRecord,
} from "@/db";
import { MOCK_SERIES } from "@/db";

// Wire-validation schema for incoming MCQ rows. Lives next to the
// other wire schemas (ExportPayloadSchema below) rather than in mcqs.ts
// because the repo trusts its own writes — only the import boundary
// needs per-row validation.
const McqLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(0),
});

const MockTestSchema = z.object({
  id: z.string().min(1),
  series: z.enum(MOCK_SERIES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjectScores: z.record(z.string(), z.number().min(0).max(100)),
  total: z.number().min(0).max(100),
  createdAt: z.string(),
});

export const EXPORT_VERSION = 3;

// When bumping EXPORT_VERSION, add a per-version migration branch in
// parsePayload before bulkAdd, and add the new collection to
// SUPPORTED_VERSIONS. Adding a table to importAll without bumping
// silently no-ops on older payloads — bulkAdd of an unrecognized
// collection just isn't called.
const ExportPayloadSchema = z.object({
  version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  exportedAt: z.string().optional(),
  schedules: z.array(z.unknown()),
  tasks: z.array(z.unknown()),
  taskProgress: z.array(z.unknown()),
  sessions: z.array(z.unknown()),
  mcqLogs: z.array(McqLogSchema).optional(),
  mockTests: z.array(MockTestSchema).optional(),
});

export interface ExportPayload {
  version: number;
  exportedAt: string;
  schedules: ScheduleRecord[];
  tasks: TaskRecord[];
  taskProgress: TaskProgressRecord[];
  sessions: SessionRecord[];
  mcqLogs: McqLogRecord[];
  mockTests: MockTestRecord[];
}

// All persisted tables, kept in one place so a new table only has to
// register itself here to be covered by clearAll / importAll resets.
const ALL_TABLES = [
  db.schedules,
  db.tasks,
  db.taskProgress,
  db.sessions,
  db.mcqLogs,
  db.mockTests,
] as const;

export async function exportAll(): Promise<ExportPayload> {
  const [schedules, tasks, taskProgress, sessions, mcqLogs, mockTests] =
    await Promise.all([
      db.schedules.toArray(),
      db.tasks.toArray(),
      db.taskProgress.toArray(),
      db.sessions.toArray(),
      db.mcqLogs.toArray(),
      db.mockTests.toArray(),
    ]);
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    schedules,
    tasks,
    taskProgress,
    sessions,
    mcqLogs,
    mockTests,
  };
}

export async function importAll(payload: unknown): Promise<void> {
  const parsed = parsePayload(payload);
  await db.transaction("rw", ALL_TABLES, async () => {
    await Promise.all(ALL_TABLES.map((t) => t.clear()));
    // bulkAdd stays explicit per table — each takes a different slice
    // of the parsed payload, so a generic map() would be type-noise
    // without saving any duplication.
    await Promise.all([
      db.schedules.bulkAdd(parsed.schedules),
      db.tasks.bulkAdd(parsed.tasks),
      db.taskProgress.bulkAdd(parsed.taskProgress),
      db.sessions.bulkAdd(parsed.sessions),
      db.mcqLogs.bulkAdd(parsed.mcqLogs),
      db.mockTests.bulkAdd(parsed.mockTests),
    ]);
  });
}

export async function clearAll(): Promise<void> {
  await db.transaction("rw", ALL_TABLES, async () => {
    await Promise.all(ALL_TABLES.map((t) => t.clear()));
  });
}

const SUPPORTED_VERSIONS = [1, 2, 3] as const;

function parsePayload(raw: unknown): ExportPayload {
  if (raw === null || typeof raw !== "object") {
    throw new Error("Invalid export: not an object");
  }
  const versioned = raw as { version?: unknown };
  if (
    versioned.version !== undefined &&
    !SUPPORTED_VERSIONS.includes(versioned.version as 1 | 2 | 3)
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
    mockTests: result.data.mockTests ?? [],
  };
}
