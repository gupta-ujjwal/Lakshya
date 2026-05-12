export { importSchedule, getLatestSchedule } from "./schedules";
export type { ImportResult } from "./schedules";

export { recordTaskProgress, listTasks, listSubjects } from "./tasks";
export type {
  TaskWithProgress,
  ListTasksFilters,
  DerivedTaskStatus,
} from "./tasks";

export { getCalendarSummary } from "./calendar";
export type { CalendarDay, CalendarHeat } from "./calendar";

export {
  startSession,
  endSession,
  recordSessionReflection,
  markSessionTaskComplete,
  getActiveSession,
} from "./sessions";
export type { ActiveSession, StartSessionResult } from "./sessions";

export { getDashboard, getOverallProgress } from "./dashboard";
export type {
  Dashboard,
  DashboardSchedule,
  DashboardStats,
  DashboardTask,
  GetDashboardInput,
  OverallProgress,
} from "./dashboard";

export { exportAll, importAll, clearAll, EXPORT_VERSION } from "./serialize";
export type { ExportPayload } from "./serialize";

export {
  PROGRESS_COMPLETED,
  PROGRESS_PENDING,
  type TaskProgressStatus,
} from "@/domain/progress";
