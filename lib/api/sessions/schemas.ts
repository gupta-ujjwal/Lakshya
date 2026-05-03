import { z } from "zod";

export const CreateSessionSchema = z.object({
  userId: z.string().min(1),
  startedAt: z.string().datetime().or(z.date()),
  endedAt: z.string().datetime().or(z.date()).optional(),
  duration: z.number().int().min(0).optional(),
});

export const UpdateSessionSchema = z.object({
  endedAt: z.string().datetime().or(z.date()).optional(),
  duration: z.number().int().min(0).optional(),
});

export const SessionQuerySchema = z.object({
  userId: z.string().optional(),
  startedAt: z.string().optional(),
  take: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});