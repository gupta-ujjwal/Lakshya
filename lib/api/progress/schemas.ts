import { z } from "zod";

export const CreateTaskProgressSchema = z.object({
  taskId: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export const UpdateTaskProgressSchema = z.object({
  status: z.string().min(1).optional(),
  notes: z.string().optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export const TaskProgressQuerySchema = z.object({
  taskId: z.string().optional(),
  date: z.string().optional(),
  take: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});