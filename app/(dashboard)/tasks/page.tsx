"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { TaskListItem, TaskStatus } from "@/app/api/tasks/route";
import type { TaskProgressStatus } from "@/lib/api/progress/schemas";
import { formatDateShort } from "@/lib/format";

type ViewMode = "list" | "kanban" | "calendar";
type PriorityTier = "high" | "medium" | "low";
type FilterPriority = "all" | PriorityTier;
type FilterStatus = "all" | TaskStatus;

interface UiTask extends TaskListItem {
  tier: PriorityTier;
}

function priorityToTier(priority: number): PriorityTier {
  if (priority <= 0) return "high";
  if (priority === 1) return "medium";
  return "low";
}

const subjectsAll = "All Subjects";

const priorityColors: Record<PriorityTier, string> = {
  high: "bg-danger text-white",
  medium: "bg-warning text-black",
  low: "bg-success text-white",
};

const filterPriorityActiveColors: Record<FilterPriority, string> = {
  all: "bg-accent text-white",
  ...priorityColors,
};

const priorityLabels: Record<PriorityTier, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedSubject, setSelectedSubject] = useState(subjectsAll);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await fetch("/api/tasks");
        if (response.status === 404) {
          router.push("/import");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data: { tasks: TaskListItem[] } = await response.json();
        setTasks(
          data.tasks.map((t) => ({ ...t, tier: priorityToTier(t.priority) }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [router]);

  const subjects = [
    subjectsAll,
    ...Array.from(new Set(tasks.map((t) => t.subject))).sort(),
  ];

  const activeFilterCount =
    (filterPriority !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0) +
    (selectedSubject !== subjectsAll ? 1 : 0);

  const filteredTasks = tasks.filter((task) => {
    if (filterPriority !== "all" && task.tier !== filterPriority) return false;
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (selectedSubject !== subjectsAll && task.subject !== selectedSubject)
      return false;
    return true;
  });

  async function toggleTaskStatus(task: UiTask) {
    const nextStatus: TaskProgressStatus =
      task.status === "completed" ? "pending" : "completed";
    setPendingTaskIds((prev) => new Set(prev).add(task.id));
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
    try {
      const res = await fetch(`/api/tasks/${task.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error("Failed to update task");
    } catch (err) {
      console.error("Toggle task progress failed:", err);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
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
          <p>Error loading tasks: {error}</p>
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

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter((t) => t.status === "overdue").length;

  return (
    <div className="space-y-6">
      <Header
        title="Tasks"
        subtitle={`${tasks.length} total · ${completedCount} done · ${overdueCount} overdue`}
        showSearch
        actions={
          <>
            <ThemeToggle />
            <button
              onClick={() => setShowAddModal(true)}
              aria-label="Add task"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-accent text-white active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </>
        }
      />

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-bg-secondary rounded-lg p-1 border border-border flex-1">
          {(["list", "kanban", "calendar"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                ${
                  viewMode === mode
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }
              `}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className="relative h-11 px-3 flex items-center gap-2 text-sm font-medium text-text-secondary bg-bg-secondary border border-border rounded-lg active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 text-[11px] font-semibold rounded-full bg-accent text-white flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Subject
            </p>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input"
            >
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Priority
            </p>
            <div className="flex flex-wrap gap-2">
              {(["all", "high", "medium", "low"] as FilterPriority[]).map((priority) => {
                const active = filterPriority === priority;
                const colors = active
                  ? filterPriorityActiveColors[priority]
                  : "bg-bg-tertiary text-text-secondary";
                return (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${colors}`}
                >
                  {priority === "all" ? "All" : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "completed", "overdue"] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-full transition-all capitalize
                    ${
                      filterStatus === status
                        ? "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary"
                    }
                  `}
                >
                  {status === "all" ? "All" : status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-3 animate-fade-in">
          {filteredTasks.length === 0 ? (
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
              </h3>
              <p className="text-text-secondary mb-4">
                {tasks.length === 0
                  ? "Import a schedule to get started"
                  : "Try clearing some filters above"}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isPending = pendingTaskIds.has(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTaskStatus(task)}
                  disabled={isPending}
                  className={`
                    w-full text-left card p-4 flex items-start gap-4 cursor-pointer
                    hover:border-border-strong transition-all
                    ${task.status === "overdue" ? "border-danger/50 bg-danger-soft/30" : ""}
                    ${task.status === "completed" ? "opacity-60" : ""}
                    disabled:opacity-50
                  `}
                >
                  <span
                    aria-hidden
                    className="w-11 h-11 -m-2.5 flex-shrink-0 flex items-center justify-center"
                  >
                    <span
                      className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${
                          task.status === "completed"
                            ? "bg-success border-success text-white"
                            : task.status === "overdue"
                            ? "border-danger"
                            : "border-border-strong"
                        }
                      `}
                    >
                      {task.status === "completed" && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </span>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`
                        font-medium text-text-primary
                        ${task.status === "completed" ? "line-through" : ""}
                      `}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-text-tertiary">
                        {formatDateShort(task.targetDate)}
                      </span>
                      <span className="px-2 py-0.5 bg-bg-tertiary text-text-secondary text-xs rounded-full">
                        {task.subject}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${priorityColors[task.tier]}`}>
                    {priorityLabels[task.tier]}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          {(["pending", "completed", "overdue"] as TaskStatus[]).map((status) => {
            const statusTasks = filteredTasks.filter((t) => t.status === status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary capitalize">
                    {status}
                  </h3>
                  <span className="px-2 py-0.5 bg-bg-tertiary text-text-secondary text-xs rounded-full">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {statusTasks.map((task) => (
                    <div key={task.id} className="card p-3 cursor-pointer hover:border-border-strong">
                      <h4 className="font-medium text-sm text-text-primary">{task.title}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-text-tertiary">{task.subject}</span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${priorityColors[task.tier]}`}
                          aria-label={`${priorityLabels[task.tier]} priority`}
                        >
                          {priorityLabels[task.tier][0]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="card p-6 animate-fade-in">
          <div className="text-center text-text-secondary py-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>Calendar view coming soon</p>
            <p className="text-sm text-text-tertiary mt-1">Calendar integration for task scheduling</p>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative card p-6 w-full max-w-md animate-slide-up">
            <h2 className="text-xl font-display font-bold text-text-primary mb-4">
              Add New Task
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Manual task creation isn&apos;t wired up yet — tasks come from your imported schedule.
              Visit <span className="font-medium">Import</span> to load a different schedule.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
