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
    label: "Import Schedule",
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
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function daysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((targetDate.getTime() - today.getTime()) / msPerDay);
}

export default function DashboardPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
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

  if (!schedule) {
    return null; // Router will handle redirect
  }

  const daysLeft = daysUntil(schedule.targetDate);
  const today = new Date().toISOString().split("T")[0];
  const todaysTasks = tasks.filter(
    (t) => new Date(t.targetDate).toISOString().split("T")[0] === today
  );
  const completedTasks = todaysTasks.filter((t) => t.completed).length;
  const progress =
    todaysTasks.length > 0 ? Math.round((completedTasks / todaysTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-6">
      <header className="pt-2 pb-4">
        <h1 className="text-2xl font-display font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">{formatDate(new Date().toISOString())}</p>
      </header>

      <div className="card p-6 text-center bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl animate-fade-in">
        <p className="text-sm font-medium text-accent mb-2">{schedule.title}</p>
        <p className="text-5xl font-display font-bold text-text-primary mb-1">{daysLeft}</p>
        <p className="text-base text-text-secondary mb-2">DAYS LEFT</p>
        <p className="text-xs text-text-muted">
          Target: {formatDate(schedule.targetDate)}
        </p>
      </div>

      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Today&apos;s Progress
          </h2>
          <span className="text-sm font-medium text-success">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm text-text-secondary mt-3">
          {completedTasks}/{todaysTasks.length} tasks completed
        </p>
      </div>

      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Today&apos;s Tasks
          </h2>
          <Link href="/tasks" className="text-sm text-accent font-medium">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {todaysTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 bg-bg-tertiary/50 rounded-lg"
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
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
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    task.completed ? "line-through text-text-muted" : "text-text-primary"
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-text-muted">{task.subject}</p>
              </div>
            </div>
          ))}
          {todaysTasks.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No tasks for today</p>
          )}
        </div>
      </div>

      <div className="card p-5 animate-fade-in">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-bg-tertiary/50 hover:bg-bg-tertiary transition-colors"
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
              <span className="text-xs text-text-secondary text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
