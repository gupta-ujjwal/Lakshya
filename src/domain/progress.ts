import { z } from "zod";

export const TaskProgressStatusSchema = z.enum(["pending", "completed"]);
export type TaskProgressStatus = z.infer<typeof TaskProgressStatusSchema>;

export const PROGRESS_COMPLETED: TaskProgressStatus = "completed";
export const PROGRESS_PENDING: TaskProgressStatus = "pending";
