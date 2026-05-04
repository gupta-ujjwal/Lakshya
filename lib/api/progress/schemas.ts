import { z } from "zod";

export const TaskProgressStatusSchema = z.enum(["pending", "completed"]);
export type TaskProgressStatus = z.infer<typeof TaskProgressStatusSchema>;

export const PROGRESS_COMPLETED: TaskProgressStatus = "completed";
export const PROGRESS_PENDING: TaskProgressStatus = "pending";

export const CreateTaskProgressSchema = z.object({
  taskId: z.string().min(1),
  status: TaskProgressStatusSchema,
  notes: z.string().optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export const UpdateTaskProgressSchema = z.object({
  status: TaskProgressStatusSchema.optional(),
  notes: z.string().optional(),
  date: z.string().datetime().or(z.date()).optional(),
});

export const TaskProgressQuerySchema = z.object({
  taskId: z.string().optional(),
  date: z.string().optional(),
  take: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});