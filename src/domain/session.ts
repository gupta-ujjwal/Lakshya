import { z } from "zod";

export const SessionReflectionSchema = z.enum(["💪", "🙂", "😩"]);
export type SessionReflection = z.infer<typeof SessionReflectionSchema>;

export const DEFAULT_FOCUS_MINUTES = 25;

export const StartSessionSchema = z.object({
  taskId: z.string().min(1).optional(),
  focusMinutes: z.number().int().min(1).max(180).optional(),
});
export type StartSessionInput = z.infer<typeof StartSessionSchema>;

export const EndSessionSchema = z.object({
  reflection: SessionReflectionSchema.optional(),
  markTaskComplete: z.boolean().optional(),
});
export type EndSessionInput = z.infer<typeof EndSessionSchema>;

// Discriminated union: open and closed sessions are different shapes,
// not a single shape with nullable fields. This makes "duration is set
// iff session is closed" expressible at the type level.
export interface OpenSession {
  id: string;
  state: "open";
  startedAt: string;
  taskId: string | null;
  focusMinutes: number;
  createdAt: string;
}

export interface ClosedSession {
  id: string;
  state: "closed";
  startedAt: string;
  endedAt: string;
  duration: number;
  taskId: string | null;
  focusMinutes: number;
  reflection: SessionReflection | null;
  createdAt: string;
}

export type Session = OpenSession | ClosedSession;

export interface TaskPreview {
  id: string;
  title: string;
  subject: string;
}
