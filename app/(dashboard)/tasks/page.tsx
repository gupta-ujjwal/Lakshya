"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";

type ViewMode = "list" | "kanban" | "calendar";
type FilterPriority = "all" | "high" | "medium" | "low";
type FilterStatus = "all" | "pending" | "completed" | "overdue";

interface Task {
  id: string;
  title: string;
  subject: string;
  targetDate: Date;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed" | "overdue";
  description?: string;
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Cardiovascular System Review",
    subject: "Physiology",
    targetDate: new Date("2026-04-24"),
    priority: "high",
    status: "completed",
    description: "Complete chapter 5 cardiovascular system",
  },
  {
    id: "2",
    title: "Drug Classifications",
    subject: "Pharmacology",
    targetDate: new Date("2026-04-24"),
    priority: "high",
    status: "completed",
    description: "Review autonomic nervous system drugs",
  },
  {
    id: "3",
    title: "Renal Physiology Quiz",
    subject: "Physiology",
    targetDate: new Date("2026-04-24"),
    priority: "medium",
    status: "completed",
    description: "Complete the online quiz on renal physiology",
  },
  {
    id: "4",
    title: "Biochemical Pathways",
    subject: "Biochemistry",
    targetDate: new Date("2026-04-24"),
    priority: "medium",
    status: "pending",
    description: "Study glycolysis, gluconeogenesis, and Krebs cycle",
  },
  {
    id: "5",
    title: "Neuroanatomy Diagrams",
    subject: "Anatomy",
    targetDate: new Date("2026-04-25"),
    priority: "low",
    status: "pending",
    description: "Label brain stem and cranial nerve nuclei",
  },
  {
    id: "6",
    title: "Pathology Case Studies",
    subject: "Pathology",
    targetDate: new Date("2026-04-23"),
    priority: "medium",
    status: "overdue",
    description: "Review 5 clinical cases involving cardiovascular pathology",
  },
  {
    id: "7",
    title: "Pharmacokinetics Problems",
    subject: "Pharmacology",
    targetDate: new Date("2026-04-26"),
    priority: "high",
    status: "pending",
    description: "Solve 20 pharmacokinetics calculation problems",
  },
  {
    id: "8",
    title: "Histology Slides Review",
    subject: "Anatomy",
    targetDate: new Date("2026-04-27"),
    priority: "low",
    status: "pending",
    description: "Review epithelial and connective tissue slides",
  },
];

const subjects = ["All Subjects", "Physiology", "Pharmacology", "Biochemistry", "Anatomy", "Pathology"];

const priorityColors = {
  high: "bg-danger text-white",
  medium: "bg-warning text-black",
  low: "bg-success text-white",
};

const priorityLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (filterPriority !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0) +
    (selectedSubject !== "All Subjects" ? 1 : 0);

  const filteredTasks = tasks.filter((task) => {
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (selectedSubject !== "All Subjects" && task.subject !== selectedSubject) return false;
    return true;
  });

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === "completed" ? "pending" : "completed" }
          : task
      )
    );
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
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
              {(["all", "high", "medium", "low"] as FilterPriority[]).map((priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-full transition-all
                    ${
                      filterPriority === priority
                        ? priority === "high"
                          ? "bg-danger text-white"
                          : priority === "medium"
                          ? "bg-warning text-black"
                          : priority === "low"
                          ? "bg-success text-white"
                          : "bg-accent text-white"
                        : "bg-bg-tertiary text-text-secondary"
                    }
                  `}
                >
                  {priority === "all" ? "All" : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
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
              <h3 className="text-lg font-semibold text-text-primary mb-2">No tasks yet</h3>
              <p className="text-text-secondary mb-4">Add your first study topic to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary inline-flex items-center justify-center gap-2 max-w-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`
                card p-4 flex items-start gap-4 cursor-pointer
                hover:border-border-strong transition-all
                ${task.status === "overdue" ? "border-danger/50 bg-danger-soft/30" : ""}
                ${task.status === "completed" ? "opacity-60" : ""}
              `}
              onClick={() => toggleTaskStatus(task.id)}
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
                {task.description && (
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-text-tertiary">
                    {task.targetDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="px-2 py-0.5 bg-bg-tertiary text-text-secondary text-xs rounded-full">
                    {task.subject}
                  </span>
                </div>
              </div>

              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
            </div>
            ))
          )}
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
          {["pending", "in_progress", "completed"].map((status) => {
            const statusTasks = filteredTasks.filter(
              (t) => (status === "pending" ? t.status === "pending" : t.status === status) || 
                     (status === "in_progress" ? t.status === "pending" : t.status === status)
            );
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary capitalize">
                    {status.replace("_", " ")}
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
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${priorityColors[task.priority]}`}
                          aria-label={`${priorityLabels[task.priority]} priority`}
                        >
                          {priorityLabels[task.priority][0]}
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
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Title
                </label>
                <input type="text" className="input" placeholder="Task title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Subject
                </label>
                <select className="input">
                  {subjects.slice(1).map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Target Date
                </label>
                <input type="date" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`
                        flex-1 py-2 text-sm font-medium rounded-lg transition-all
                        ${priorityColors[p]} hover:opacity-80
                      `}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}