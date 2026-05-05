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
