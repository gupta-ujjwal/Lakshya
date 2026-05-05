import type { Prisma } from "@prisma/client";

// Shared Prisma `select` shapes used by the three session routes (POST,
// GET active, PATCH) so a column added to one is visible to all without
// drift. The "open" shape is the subset returned during a session's
// lifetime; the "closed" shape is the superset returned by PATCH.

export const SESSION_OPEN_SELECT = {
  id: true,
  startedAt: true,
  taskId: true,
  focusMinutes: true,
} as const;

export const SESSION_OPEN_WITH_TASK_SELECT = {
  ...SESSION_OPEN_SELECT,
  task: { select: { id: true, title: true, subject: true } },
} as const;

export const SESSION_CLOSED_SELECT = {
  ...SESSION_OPEN_SELECT,
  endedAt: true,
  duration: true,
  reflection: true,
} as const;

export type OpenSession = Prisma.SessionGetPayload<{
  select: typeof SESSION_OPEN_SELECT;
}>;
export type ClosedSession = Prisma.SessionGetPayload<{
  select: typeof SESSION_CLOSED_SELECT;
}>;

export interface TaskPreview {
  id: string;
  title: string;
  subject: string;
}

export function formatOpenSession(s: OpenSession) {
  return {
    id: s.id,
    startedAt: s.startedAt.toISOString(),
    taskId: s.taskId,
    focusMinutes: s.focusMinutes,
  };
}

export function formatClosedSession(s: ClosedSession) {
  return {
    session: {
      ...s,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
    },
  };
}
