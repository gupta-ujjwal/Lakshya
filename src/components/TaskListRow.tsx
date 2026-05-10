import { formatDateLong } from "@/lib/format";
import type { TaskWithProgress } from "@/repo";

interface TaskListRowProps {
  task: TaskWithProgress;
  disabled: boolean;
  onToggle: () => void;
  // When the surrounding context is already subject-scoped (the
  // Subjects detail page), suppress the subject in the metadata line
  // so the row reads as "title · date" instead of "title · subject · date".
  hideSubject?: boolean;
}

export function TaskListRow({
  task,
  disabled,
  onToggle,
  hideSubject = false,
}: TaskListRowProps) {
  const completed = task.status === "completed";
  const overdue = task.status === "overdue";
  return (
    <li>
      <button
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-bg-tertiary/50 transition-colors text-left disabled:opacity-60"
      >
        <span
          className="w-11 h-11 -m-2 flex-shrink-0 flex items-center justify-center"
          aria-hidden
        >
          <span
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              completed
                ? "bg-success border-success text-white"
                : overdue
                  ? "border-danger"
                  : "border-border-strong"
            }`}
          >
            {completed && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </span>
        </span>
        <span className="flex-1 min-w-0">
          <span
            className={`block text-sm font-medium truncate ${
              completed ? "line-through text-text-muted" : "text-text-primary"
            }`}
          >
            {task.title}
          </span>
          <span className="block text-xs text-text-muted">
            {hideSubject
              ? formatDateLong(task.targetDate)
              : `${task.subject} · ${formatDateLong(task.targetDate)}`}
          </span>
        </span>
        {overdue && (
          <span className="text-[10px] font-semibold uppercase text-danger">
            Overdue
          </span>
        )}
      </button>
    </li>
  );
}
