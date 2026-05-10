import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDateLong } from "@/lib/format";
import { DaysLeftHero } from "@/components/DaysLeftHero";
import { SessionWidget } from "@/components/SessionWidget";
import { getPinnedSubjects, unpinSubject } from "@/lib/focus-pin";
import {
  getDashboard,
  PROGRESS_COMPLETED,
  PROGRESS_PENDING,
  recordTaskProgress,
  type Dashboard,
  type DashboardTask,
} from "@/repo";

const FOCUS_TASK_LIMIT = 10;

function adherenceTone(pct: number): { color: string; label: string } {
  if (pct >= 85) return { color: "text-success", label: "On track" };
  if (pct >= 60) return { color: "text-warning", label: "Slipping" };
  return { color: "text-danger", label: "Behind" };
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Dashboard | null>(null);
  const [pinnedSubjects, setPinnedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  // One reader for both atoms. Mount and refresh both call here; the
  // localStorage→repo bridge happens once per fetch instead of being
  // reproduced at each call site.
  async function load(): Promise<Dashboard | null> {
    const pins = getPinnedSubjects();
    setPinnedSubjects(pins);
    return getDashboard({ pinnedSubjects: pins });
  }

  async function refresh() {
    try {
      const d = await load();
      if (d) setData(d);
    } catch {
      // Silent: refresh failures are not user-actionable; the prior state is still valid.
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await load();
        if (cancelled) return;
        if (!d) {
          navigate("/import", { replace: true });
          return;
        }
        setData(d);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function toggleTaskComplete(task: DashboardTask) {
    const nextCompleted = !task.completedToday;
    setPendingTaskIds((prev) => new Set(prev).add(task.id));
    setData((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id ? { ...t, completedToday: nextCompleted } : t,
            ),
          }
        : prev,
    );
    try {
      await recordTaskProgress(
        task.id,
        nextCompleted ? PROGRESS_COMPLETED : PROGRESS_PENDING,
      );
    } catch {
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === task.id ? { ...t, completedToday: !nextCompleted } : t,
              ),
            }
          : prev,
      );
    } finally {
      setPendingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }

  function handleUnpin(subject: string) {
    unpinSubject(subject);
    void refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2">
        <div className="card p-6 bg-danger-soft text-danger">
          <p>Error loading dashboard: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { schedule, stats, tasks } = data;

  // Two render axes from one fetch (see DashboardTask.scheduledForToday
  // / pinnedSubject). A pinned-subject task that's also scheduled for
  // today appears in the scheduled list only — no double-listing.
  const todaysTasks = tasks.filter((t) => t.scheduledForToday);
  const completedTodayCount = todaysTasks.filter((t) => t.completedToday).length;
  const progress =
    todaysTasks.length > 0
      ? Math.round((completedTodayCount / todaysTasks.length) * 100)
      : 0;
  const upNext = todaysTasks
    .filter((t) => !t.completedToday)
    .sort((a, b) => b.priority - a.priority)[0];
  const focusTasks = pinnedSubjects.length
    ? tasks
        .filter(
          (t) => t.pinnedSubject && !t.scheduledForToday && !t.completedEver,
        )
        .slice(0, FOCUS_TASK_LIMIT)
    : [];
  const tone = adherenceTone(stats.adherence);

  return (
    <div className="space-y-5 pb-6">
      <header className="pt-2 pb-1 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary">
            {formatDateLong(new Date().toISOString())}
          </p>
        </div>
      </header>

      <DaysLeftHero
        title={schedule.title}
        targetDate={schedule.targetDate}
        hoursPerDay={schedule.hoursPerDay}
      />

      {upNext ? (
        <SessionWidget
          task={{ id: upNext.id, title: upNext.title, subject: upNext.subject }}
          onSessionFinished={refresh}
        />
      ) : focusTasks.length > 0 ? (
        <SessionWidget
          task={{
            id: focusTasks[0].id,
            title: focusTasks[0].title,
            subject: focusTasks[0].subject,
          }}
          onSessionFinished={refresh}
        />
      ) : todaysTasks.length > 0 ? (
        <div className="card p-5 bg-success-soft animate-fade-in text-center">
          <p className="text-2xl mb-1" aria-hidden>🎉</p>
          <p className="text-base font-semibold text-text-primary">
            All caught up for today
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {todaysTasks.length} task{todaysTasks.length !== 1 ? "s" : ""} done
          </p>
        </div>
      ) : (
        <div className="card p-5 animate-fade-in text-center">
          <p className="text-base font-semibold text-text-primary">
            Nothing scheduled today
          </p>
          <p className="text-sm text-text-secondary mt-1">
            Pin a subject from the Subjects tab to study it today
          </p>
        </div>
      )}

      {stats.overdueCount > 0 && (
        <div className="card flex items-center justify-between p-4 border border-danger/30 bg-danger-soft/50 animate-fade-in">
          <span className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-full bg-danger/15 flex items-center justify-center"
              aria-hidden
            >
              <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span>
              <p className="text-sm font-semibold text-text-primary">
                {stats.overdueCount} task{stats.overdueCount !== 1 ? "s" : ""} carried over
              </p>
              <p className="text-xs text-text-secondary">
                Catch up below
              </p>
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl" aria-hidden>🔥</p>
          <p className="text-xl font-display font-bold text-text-primary leading-tight">
            {stats.streak}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">day streak</p>
        </div>
        <div className="card p-3 text-center">
          <p className={`text-xl font-display font-bold leading-tight ${tone.color}`}>
            {stats.adherence}%
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">7-day plan</p>
          <p className={`text-[10px] font-medium ${tone.color}`}>{tone.label}</p>
        </div>
        <div className="card p-3 text-center">
          <p
            data-testid="total-hours-stat"
            className="text-xl font-display font-bold text-text-primary leading-tight"
          >
            {formatHours(stats.totalStudyMinutes)}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">studied</p>
        </div>
      </div>

      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Today&apos;s Tasks
          </h2>
          <span className="text-xs text-text-muted tabular-nums">
            {completedTodayCount}/{todaysTasks.length}
          </span>
        </div>
        {todaysTasks.length > 0 && (
          <div className="progress-bar h-1 mb-3">
            <div
              className="progress-bar-fill h-1"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="space-y-1.5">
          {todaysTasks.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              No tasks for today
            </p>
          )}
          {todaysTasks.slice(0, 8).map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              disabled={pendingTaskIds.has(task.id)}
              onToggle={() => void toggleTaskComplete(task)}
            />
          ))}
        </div>
      </div>

      {focusTasks.length > 0 && (
        <div
          data-testid="focus-section"
          className="card p-5 animate-fade-in border border-accent/30 bg-accent-soft/20"
        >
          <div className="flex items-start justify-between mb-3 gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Today&apos;s focus
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Pinned: {pinnedSubjects.join(", ")}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {pinnedSubjects.map((s) => (
                <button
                  key={s}
                  onClick={() => handleUnpin(s)}
                  className="text-[11px] font-medium text-accent hover:underline"
                >
                  Unpin {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {focusTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                disabled={pendingTaskIds.has(task.id)}
                onToggle={() => void toggleTaskComplete(task)}
                showDate
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-text-muted pt-2">
        <Link to="/import" className="hover:text-text-secondary hover:underline">
          Manage data
        </Link>
      </p>
    </div>
  );
}

interface TaskRowProps {
  task: DashboardTask;
  disabled: boolean;
  onToggle: () => void;
  showDate?: boolean;
}

function TaskRow({ task, disabled, onToggle, showDate = false }: TaskRowProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-tertiary/50 active:bg-bg-tertiary transition-colors text-left disabled:opacity-60"
    >
      <span
        className="w-11 h-11 -m-2 flex-shrink-0 flex items-center justify-center"
        aria-hidden
      >
        <span
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completedToday
              ? "bg-success border-success text-white"
              : "border-border-strong"
          }`}
        >
          {task.completedToday && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={`block text-sm font-medium truncate ${
            task.completedToday ? "line-through text-text-muted" : "text-text-primary"
          }`}
        >
          {task.title}
        </span>
        <span className="block text-xs text-text-muted">
          {task.subject}
          {showDate ? ` · ${formatDateLong(task.targetDate)}` : ""}
        </span>
      </span>
    </button>
  );
}
