import {
  PROGRESS_COMPLETED,
  type TaskProgressStatus,
} from "./progress";

/**
 * UI-facing status derived from a task's stored row + its latest progress
 * row + the current date. The stored enum (`TaskProgressStatus`,
 * "pending"|"completed") doesn't carry the "is the date in the past?"
 * dimension, so anything that needs to render todo/overdue/done — both
 * the Tasks list and the Calendar — should call this rather than
 * re-implement the rule.
 */
export type EffectiveTaskStatus = "todo" | "completed" | "overdue";

interface TaskShape {
  targetDate: string;
}

interface ProgressShape {
  status: TaskProgressStatus;
}

export function getEffectiveStatus(
  task: TaskShape,
  progress: ProgressShape | null,
  todayKey: string,
): EffectiveTaskStatus {
  if (progress?.status === PROGRESS_COMPLETED) return "completed";
  if (task.targetDate < todayKey) return "overdue";
  return "todo";
}
