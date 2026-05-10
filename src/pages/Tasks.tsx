import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addDaysToKey, today } from "@/lib/dates";
import { formatDateLong } from "@/lib/format";
import {
  listSubjects,
  listTasks,
  PROGRESS_COMPLETED,
  PROGRESS_PENDING,
  recordTaskProgress,
  type DerivedTaskStatus,
  type TaskWithProgress,
} from "@/repo";

type StatusFilter = DerivedTaskStatus | "all";
type DateRangeKey = "all" | "today" | "this-week" | "next-week" | "next-30";

const STATUS_OPTIONS: ReadonlyArray<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "todo", label: "To do" },
  { key: "completed", label: "Done" },
  { key: "overdue", label: "Overdue" },
];

const DATE_RANGE_OPTIONS: ReadonlyArray<{ key: DateRangeKey; label: string }> =
  [
    { key: "all", label: "All dates" },
    { key: "today", label: "Today" },
    { key: "this-week", label: "Next 7 days" },
    { key: "next-week", label: "Next 14 days" },
    { key: "next-30", label: "Next 30 days" },
  ];

function computeDateBounds(
  range: DateRangeKey,
  pinnedDate: string | null,
): { from?: string; to?: string } {
  if (pinnedDate) return { from: pinnedDate, to: pinnedDate };
  const t = today();
  switch (range) {
    case "today":
      return { from: t, to: t };
    case "this-week":
      return { from: t, to: addDaysToKey(t, 7) };
    case "next-week":
      return { from: t, to: addDaysToKey(t, 14) };
    case "next-30":
      return { from: t, to: addDaysToKey(t, 30) };
    case "all":
    default:
      return {};
  }
}

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pinnedDate = searchParams.get("date");

  const [tasks, setTasks] = useState<TaskWithProgress[] | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeKey>("all");

  // When a calendar drill-down pins a date, the date-range filter is
  // displaced — show all subjects/statuses for that one day instead.
  const effectiveRange = pinnedDate ? "all" : dateRange;
  const bounds = useMemo(
    () => computeDateBounds(effectiveRange, pinnedDate),
    [effectiveRange, pinnedDate],
  );

  // Mirror Dashboard.tsx's IIFE pattern: do the fetch inside the effect so
  // the eslint react-hooks/set-state-in-effect rule (which flags
  // useCallback-wrapped fetchers) sees a single self-contained body.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [t, s] = await Promise.all([
        listTasks({
          status: statusFilter,
          subjects: subjectFilter,
          fromDate: bounds.from,
          toDate: bounds.to,
        }),
        listSubjects(),
      ]);
      if (cancelled) return;
      setTasks(t);
      setSubjects(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, subjectFilter, bounds.from, bounds.to]);

  async function toggleTask(task: TaskWithProgress) {
    const next =
      task.status === "completed" ? PROGRESS_PENDING : PROGRESS_COMPLETED;
    setPendingIds((s) => new Set(s).add(task.id));
    setTasks((prev) =>
      prev
        ? prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: next === PROGRESS_COMPLETED ? "completed" : "todo",
                }
              : t,
          )
        : prev,
    );
    try {
      await recordTaskProgress(task.id, next);
    } catch {
      // Roll back the optimistic flip.
      setTasks((prev) =>
        prev
          ? prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
          : prev,
      );
    } finally {
      setPendingIds((s) => {
        const n = new Set(s);
        n.delete(task.id);
        return n;
      });
    }
  }

  function toggleSubject(s: string) {
    setSubjectFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function clearPinnedDate() {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.delete("date");
      return next;
    });
  }

  if (tasks === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2">
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Tasks
        </h1>
        {pinnedDate ? (
          <p className="text-sm text-text-secondary">
            Showing {formatDateLong(pinnedDate)}.{" "}
            <button
              onClick={clearPinnedDate}
              className="text-accent hover:underline"
            >
              Clear
            </button>
          </p>
        ) : (
          <p className="text-sm text-text-secondary">
            Browse, filter, and tick off tasks across the schedule.
          </p>
        )}
      </header>

      {!pinnedDate && (
        <FilterChips
          options={DATE_RANGE_OPTIONS}
          value={dateRange}
          onChange={setDateRange}
          label="Range"
        />
      )}

      <FilterChips
        options={STATUS_OPTIONS}
        value={statusFilter}
        onChange={setStatusFilter}
        label="Status"
      />

      {subjects.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
            Subjects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => {
              const active = subjectFilter.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`min-h-[32px] px-3 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-accent text-white border-accent"
                      : "bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary"
                  }`}
                >
                  {s}
                </button>
              );
            })}
            {subjectFilter.length > 0 && (
              <button
                onClick={() => setSubjectFilter([])}
                className="min-h-[32px] px-3 rounded-full text-xs font-medium text-danger"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card p-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            No tasks match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                disabled={pendingIds.has(task.id)}
                onToggle={() => void toggleTask(task)}
              />
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-text-muted text-center">
        {tasks.length} task{tasks.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}

interface FilterChipsProps<T extends string> {
  options: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  label: string;
}

function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: FilterChipsProps<T>) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`min-h-[32px] px-3 rounded-full text-xs font-medium border transition-colors ${
              value === opt.key
                ? "bg-accent text-white border-accent"
                : "bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: TaskWithProgress;
  disabled: boolean;
  onToggle: () => void;
}

function TaskRow({ task, disabled, onToggle }: TaskRowProps) {
  const completed = task.status === "completed";
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
                : task.status === "overdue"
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
            {task.subject} · {formatDateLong(task.targetDate)}
          </span>
        </span>
        {task.status === "overdue" && (
          <span className="text-[10px] font-semibold uppercase text-danger">
            Overdue
          </span>
        )}
      </button>
    </li>
  );
}
