"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Schedule {
  id: string;
  title: string;
  targetDate: string;
}

interface Task {
  id: string;
  title: string;
  subject: string;
  targetDate: string;
  priority: number;
  completed?: boolean;
}

interface Stats {
  streak: number;
  adherence: number;
  overdueCount: number;
  adherenceWindowDays: number;
}

const quickActions = [
  {
    label: "Add Task",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    href: "/tasks?action=add",
    color: "accent",
  },
  {
    label: "Quick Note",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    href: "/notes?action=quick",
    color: "success",
  },
  {
    label: "Set Reminder",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    href: "/reminders?action=add",
    color: "warning",
  },
  {
    label: "Import",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    href: "/import",
    color: "text",
  },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function adherenceTone(pct: number): { color: string; label: string } {
  if (pct >= 85) return { color: "text-success", label: "On track" };
  if (pct >= 60) return { color: "text-warning", label: "Slipping" };
  return { color: "text-danger", label: "Behind" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard");
        if (response.status === 404) {
          router.push("/import");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
        setSchedule(data.schedule);
        setTasks(data.tasks || []);
        setStats(data.stats || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  async function toggleTaskComplete(task: Task) {
    const nextCompleted = !task.completed;
    setPendingTaskIds((prev) => new Set(prev).add(task.id));
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
    );
    try {
      const res = await fetch(`/api/tasks/${task.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextCompleted ? "completed" : "pending" }),
      });
      if (!res.ok) throw new Error("Failed to update task");
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !nextCompleted } : t))
      );
    } finally {
      setPendingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
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

  if (!schedule) return null;

  const today = new Date().toISOString().split("T")[0];
  const todaysTasks = tasks.filter((t) => t.targetDate === today);
  const completedTodayCount = todaysTasks.filter((t) => t.completed).length;
  const progress =
    todaysTasks.length > 0
      ? Math.round((completedTodayCount / todaysTasks.length) * 100)
      : 0;

  const upNext = todaysTasks
    .filter((t) => !t.completed)
    .sort((a, b) => b.priority - a.priority)[0];

  const adherence = stats?.adherence ?? 0;
  const streak = stats?.streak ?? 0;
  const overdueCount = stats?.overdueCount ?? 0;
  const tone = adherenceTone(adherence);

  return (
    <div className="space-y-5 pb-6">
      <header className="pt-2 pb-1 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary">
            {formatDate(new Date().toISOString())}
          </p>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="w-11 h-11 -mt-1 -mr-2 flex items-center justify-center rounded-full text-text-secondary hover:bg-bg-secondary active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </header>

      {upNext ? (
        <div className="card p-5 bg-gradient-to-br from-accent/10 to-accent/5 animate-fade-in">
          <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
            Up Next
          </p>
          <h2 className="text-lg font-display font-semibold text-text-primary leading-snug">
            {upNext.title}
          </h2>
          <p className="text-sm text-text-secondary mt-1">{upNext.subject}</p>
          <button
            onClick={() => toggleTaskComplete(upNext)}
            disabled={pendingTaskIds.has(upNext.id)}
            className="mt-4 w-full h-12 rounded-md bg-accent text-white font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-60"
          >
            Mark complete
          </button>
        </div>
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

      {overdueCount > 0 && (
        <Link
          href="/tasks?filter=overdue"
          className="card flex items-center justify-between p-4 border border-danger/30 bg-danger-soft/50 animate-fade-in active:scale-[0.99] transition-all"
        >
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
                {overdueCount} task{overdueCount !== 1 ? "s" : ""} carried over
              </p>
              <p className="text-xs text-text-secondary">
                Tap to review and reschedule
              </p>
            </span>
          </span>
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-xl" aria-hidden>🔥</p>
          <p className="text-xl font-display font-bold text-text-primary leading-tight">
            {streak}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            day streak
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className={`text-xl font-display font-bold leading-tight ${tone.color}`}>
            {adherence}%
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            7-day plan
          </p>
          <p className={`text-[10px] font-medium ${tone.color}`}>{tone.label}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl font-display font-bold text-text-primary leading-tight">
            {completedTodayCount}/{todaysTasks.length}
          </p>
          <p className="text-[11px] text-text-secondary mt-0.5">
            today
          </p>
          <div className="progress-bar mt-1.5 h-1">
            <div
              className="progress-bar-fill h-1"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Today&apos;s Tasks
          </h2>
          <Link href="/tasks" className="text-sm text-accent font-medium">
            View all
          </Link>
        </div>
        <div className="space-y-1.5">
          {todaysTasks.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">
              No tasks for today
            </p>
          )}
          {todaysTasks.slice(0, 5).map((task) => {
            const isPending = pendingTaskIds.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => toggleTaskComplete(task)}
                disabled={isPending}
                className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-bg-tertiary/50 active:bg-bg-tertiary transition-colors text-left disabled:opacity-60"
              >
                <span
                  className={`w-11 h-11 -m-2 flex-shrink-0 flex items-center justify-center`}
                  aria-hidden
                >
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? "bg-success border-success text-white"
                        : "border-border-strong"
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm font-medium truncate ${
                      task.completed ? "line-through text-text-muted" : "text-text-primary"
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
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-2 rounded-xl bg-bg-tertiary/40 hover:bg-bg-tertiary transition-colors"
            >
              <span
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  action.color === "accent"
                    ? "bg-accent-soft text-accent"
                    : action.color === "success"
                    ? "bg-success-soft text-success"
                    : action.color === "warning"
                    ? "bg-warning-soft text-warning"
                    : "bg-bg-tertiary text-text-secondary"
                }`}
              >
                {action.icon}
              </span>
              <span className="text-[11px] text-text-secondary text-center leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
