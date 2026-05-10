import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addDaysToKey, today } from "@/lib/dates";
import { formatDateLong } from "@/lib/format";
import { decodeTaskDate, TASK_DATE_PARAM } from "@/lib/task-date-param";
import { TaskListRow } from "@/components/TaskListRow";
import {
  getOverallProgress,
  listSubjects,
  listTasks,
  PROGRESS_COMPLETED,
  PROGRESS_PENDING,
  recordTaskProgress,
  type DerivedTaskStatus,
  type OverallProgress,
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
  const pinnedDate = decodeTaskDate(searchParams.get(TASK_DATE_PARAM));

  const [tasks, setTasks] = useState<TaskWithProgress[] | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [overall, setOverall] = useState<OverallProgress | null>(null);
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

  // Overall progress is filter-independent — fetch once on mount and
  // refresh on toggle (see toggleTask). Re-fetching on every filter
  // change would be wasted IndexedDB work.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const o = await getOverallProgress();
      if (!cancelled) setOverall(o);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      // A toggle changes the overall completed count; refresh that
      // bar so it doesn't drift from reality across user toggles.
      const o = await getOverallProgress();
      setOverall(o);
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

  function clearPinnedDate() {
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.delete(TASK_DATE_PARAM);
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

  const overallPct =
    overall && overall.total > 0
      ? Math.round((overall.completed / overall.total) * 100)
      : 0;
  const subjectFilterLabel =
    subjectFilter.length === 0
      ? "All subjects"
      : subjectFilter.length === 1
        ? subjectFilter[0]
        : `${subjectFilter.length} subjects`;

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

      {overall && overall.total > 0 && (
        <div className="card p-4" data-testid="overall-progress">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Overall progress
            </p>
            <p className="text-xs text-text-muted tabular-nums">
              {overall.completed}/{overall.total} · {overallPct}%
            </p>
          </div>
          <div className="progress-bar h-2">
            <div
              className="progress-bar-fill h-2"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {!pinnedDate && (
          <SelectFilter<DateRangeKey>
            label="Range"
            value={dateRange}
            options={DATE_RANGE_OPTIONS}
            onChange={setDateRange}
          />
        )}
        <SelectFilter<StatusFilter>
          label="Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
      </div>

      {subjects.length > 0 && (
        <details
          className="card p-3 group"
          data-testid="subjects-filter"
        >
          <summary className="cursor-pointer flex items-center justify-between text-sm">
            <span className="font-semibold text-text-primary">Subjects</span>
            <span className="text-xs text-text-muted">
              {subjectFilterLabel}
            </span>
          </summary>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {subjects.map((s) => {
              const active = subjectFilter.includes(s);
              return (
                <button
                  key={s}
                  onClick={() =>
                    setSubjectFilter((prev) =>
                      prev.includes(s)
                        ? prev.filter((x) => x !== s)
                        : [...prev, s],
                    )
                  }
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
        </details>
      )}

      <div className="card p-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            No tasks match these filters.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <TaskListRow
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

interface SelectFilterProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ key: T; label: string }>;
  onChange: (next: T) => void;
}

function SelectFilter<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFilterProps<T>) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 w-full min-h-[44px] rounded-md border border-border bg-bg-secondary text-sm font-medium text-text-primary px-3 py-2 normal-case tracking-normal focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

