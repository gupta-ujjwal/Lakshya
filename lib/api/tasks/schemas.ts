import { z } from "zod";

export const CreateTaskSchema = z.object({
  scheduleId: z.string().min(1),
  title: z.string().min(1).max(255),
  subject: z.string().min(1).max(100),
  targetDate: z.string().datetime().or(z.date()),
  priority: z.number().int().min(0).max(10).optional().default(0),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(100).optional(),
  targetDate: z.string().datetime().or(z.date()).optional(),
  priority: z.number().int().min(0).max(10).optional(),
});

export const TaskQuerySchema = z.object({
  scheduleId: z.string().optional(),
  subject: z.string().optional(),
  take: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});