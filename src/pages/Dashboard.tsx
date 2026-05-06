import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { downloadJson } from "@/lib/download";
import { formatDateLong } from "@/lib/format";
import { today } from "@/lib/dates";
import { DaysLeftHero } from "@/components/DaysLeftHero";
import { SessionWidget } from "@/components/SessionWidget";
import {
  clearAll,
  exportAll,
  getDashboard,
  importAll,
  PROGRESS_COMPLETED,
  PROGRESS_PENDING,
  recordTaskProgress,
  type Dashboard,
  type DashboardTask,
} from "@/repo";

function adherenceTone(pct: number): { color: string; label: string } {
  if (pct >= 85) return { color: "text-success", label: "On track" };
  if (pct >= 60) return { color: "text-warning", label: "Slipping" };
  return { color: "text-danger", label: "Behind" };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [dataMessage, setDataMessage] = useState<string | null>(null);

  async function refresh() {
    try {
      const d = await getDashboard();
      if (d) setData(d);
    } catch {
      // Silent: refresh failures are not user-actionable; the prior state is still valid.
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await getDashboard();
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

  async function handleExport() {
    setDataMessage(null);
    try {
      downloadJson(`lakshya-${today()}.json`, await exportAll());
      setDataMessage("Exported.");
    } catch (err) {
      setDataMessage(err instanceof Error ? err.message : "Export failed");
    }
  }

  async function handleImportFile(file: File) {
    setDataMessage(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importAll(payload);
      setDataMessage("Imported. Reloading…");
      const d = await getDashboard();
      setData(d);
      if (!d) navigate("/import", { replace: true });
    } catch (err) {
      setDataMessage(err instanceof Error ? err.message : "Import failed");
    }
  }

  async function handleClear() {
    if (!confirm("Erase all local data? This cannot be undone.")) return;
    await clearAll();
    navigate("/import", { replace: true });
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
  const todayKey = today();
  const todaysTasks = tasks.filter((t) => t.targetDate === todayKey);
  const completedTodayCount = todaysTasks.filter((t) => t.completedToday).length;
  const progress =
    todaysTasks.length > 0
      ? Math.round((completedTodayCount / todaysTasks.length) * 100)
      : 0;
  const upNext = todaysTasks
    .filter((t) => !t.completedToday)
    .sort((a, b) => b.priority - a.priority)[0];
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
            Take a break or pull from the backlog
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
          <p className="text-xl font-display font-bold text-text-primary leading-tight">
            {completedTodayCount}/{todaysTasks.length}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">today</p>
          <div className="progress-bar mt-1.5 h-1">
            <div
              className="progress-bar-fill h-1"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card p-5 animate-fade-in">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Today&apos;s Tasks
        </h2>
        <div className="space-y-1.5">
          {todaysTasks.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              No tasks for today
            </p>
          )}
          {todaysTasks.slice(0, 8).map((task) => {
            const isPending = pendingTaskIds.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => toggleTaskComplete(task)}
                disabled={isPending}
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
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-5 animate-fade-in">
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Your data
        </h2>
        <p className="text-xs text-text-secondary mb-3">
          Lakshya runs entirely on this device. Export to back up; import to
          restore on a new browser.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExport}
            data-testid="export-button"
            className="h-10 rounded-md bg-bg-tertiary text-sm font-medium text-text-primary active:scale-[0.98] transition-all"
          >
            Export JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            data-testid="import-button"
            className="h-10 rounded-md bg-bg-tertiary text-sm font-medium text-text-primary active:scale-[0.98] transition-all"
          >
            Import JSON
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = "";
          }}
        />
        <Link
          to="/import"
          className="mt-2 block text-center h-10 leading-10 rounded-md text-sm font-medium text-accent hover:bg-bg-tertiary/40 transition-colors"
        >
          Import a study schedule
        </Link>
        <button
          onClick={handleClear}
          className="mt-2 w-full h-10 text-sm font-medium text-danger active:scale-[0.98] transition-all"
        >
          Erase all data
        </button>
        {dataMessage && (
          <p className="mt-2 text-xs text-text-secondary text-center">
            {dataMessage}
          </p>
        )}
      </div>
    </div>
  );
}
