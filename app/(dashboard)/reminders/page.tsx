"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dateTime: Date;
  repeat: "none" | "daily" | "weekly" | "monthly";
  subject?: string;
  isActive: boolean;
  type: "task" | "study" | "break" | "custom";
}

const mockReminders: Reminder[] = [
  {
    id: "1",
    title: "Morning Study Session",
    description: "Review yesterday's notes and prepare for today",
    dateTime: new Date("2026-04-24T08:00:00"),
    repeat: "daily",
    subject: "General",
    isActive: true,
    type: "study",
  },
  {
    id: "2",
    title: "Physiology Quiz",
    description: "Online quiz on cardiovascular system",
    dateTime: new Date("2026-04-25T14:00:00"),
    repeat: "none",
    subject: "Physiology",
    isActive: true,
    type: "task",
  },
  {
    id: "3",
    title: "Short Break",
    description: "Take a 15-minute break after study session",
    dateTime: new Date("2026-04-24T12:00:00"),
    repeat: "daily",
    isActive: true,
    type: "break",
  },
  {
    id: "4",
    title: "Pharmacology Review",
    description: "Review drug classifications and mechanisms",
    dateTime: new Date("2026-04-26T10:00:00"),
    repeat: "weekly",
    subject: "Pharmacology",
    isActive: true,
    type: "study",
  },
  {
    id: "5",
    title: "Biochemistry Test",
    description: "Unit test on metabolic pathways",
    dateTime: new Date("2026-04-28T09:00:00"),
    repeat: "none",
    subject: "Biochemistry",
    isActive: false,
    type: "task",
  },
];

const typeIcons: Record<Reminder["type"], JSX.Element> = {
  task: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  study: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  break: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  custom: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

const typeColors: Record<Reminder["type"], string> = {
  task: "bg-accent-soft text-accent",
  study: "bg-success-soft text-success",
  break: "bg-warning-soft text-warning",
  custom: "bg-bg-tertiary text-text-secondary",
};

const repeatLabels = {
  none: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(mockReminders);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<"all" | Reminder["type"]>("all");
  const [showInactive, setShowInactive] = useState(false);

  const activeReminders = reminders.filter((r) => r.isActive);
  const inactiveReminders = reminders.filter((r) => !r.isActive);

  const filteredReminders = reminders.filter((r) => {
    if (!showInactive && !r.isActive) return false;
    if (filterType !== "all" && r.type !== filterType) return false;
    return true;
  });

  const upcomingReminders = filteredReminders
    .filter((r) => r.isActive)
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const todayReminders = upcomingReminders.filter(
    (r) => r.dateTime.toDateString() === new Date().toDateString()
  );
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const thisWeekReminders = upcomingReminders.filter((r) => {
    const diff = r.dateTime.getTime() - now;
    return diff > 0 && diff < oneWeek;
  });

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <Header
        title="Reminders"
        subtitle={`${activeReminders.length} active reminders`}
        actions={
          <>
            <ThemeToggle />
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Reminder
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-text-primary">{todayReminders.length}</p>
              <p className="text-sm text-text-secondary">Today</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-soft flex items-center justify-center">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-text-primary">{thisWeekReminders.length}</p>
              <p className="text-sm text-text-secondary">This Week</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-soft flex items-center justify-center">
              <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-text-primary">
                {reminders.filter((r) => r.repeat !== "none").length}
              </p>
              <p className="text-sm text-text-secondary">Recurring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-secondary">Filter:</span>
        {(["all", "task", "study", "break", "custom"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-full transition-all capitalize
              ${
                filterType === type
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              }
            `}
          >
            {type === "all" ? "All" : type}
          </button>
        ))}
        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-border-strong text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-secondary">Show inactive</span>
        </label>
      </div>

      <div className="space-y-3">
        {filteredReminders
          .filter((r) => r.isActive)
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
          .map((reminder) => (
            <div
              key={reminder.id}
              className="card p-4 flex items-start gap-4 hover:border-border-strong transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[reminder.type]}`}>
                {typeIcons[reminder.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text-primary">{reminder.title}</h3>
                  {reminder.repeat !== "none" && (
                    <span className="px-2 py-0.5 bg-accent-soft text-accent text-xs font-medium rounded-full">
                      {repeatLabels[reminder.repeat]}
                    </span>
                  )}
                </div>
                {reminder.description && (
                  <p className="text-sm text-text-secondary mt-1">{reminder.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-text-tertiary flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {reminder.dateTime.toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {reminder.subject && (
                    <span className="px-2 py-0.5 bg-bg-tertiary text-text-secondary text-xs rounded-full">
                      {reminder.subject}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleReminder(reminder.id)}
                  className={`
                    p-2 rounded-lg transition-all
                    ${reminder.isActive ? "text-success hover:bg-success-soft" : "text-text-tertiary hover:bg-bg-tertiary"}
                  `}
                  title={reminder.isActive ? "Pause reminder" : "Resume reminder"}
                >
                  {reminder.isActive ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-2 text-text-tertiary hover:text-danger hover:bg-danger-soft rounded-lg transition-all"
                  title="Delete reminder"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
      </div>

      {inactiveReminders.length > 0 && !showInactive && (
        <button
          onClick={() => setShowInactive(true)}
          className="btn btn-secondary w-full"
        >
          Show {inactiveReminders.length} inactive reminder{inactiveReminders.length > 1 ? "s" : ""}
        </button>
      )}

      {showAddModal && (
        <AddReminderModal
          onClose={() => setShowAddModal(false)}
          onAdd={(reminder) => {
            setReminders((prev) => [...prev, { ...reminder, id: Date.now().toString() }]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function AddReminderModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (reminder: Omit<Reminder, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState<Reminder["repeat"]>("none");
  const [type, setType] = useState<Reminder["type"]>("custom");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${date}T${time}`);
    onAdd({
      title,
      description: description || undefined,
      dateTime,
      repeat,
      isActive: true,
      type,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <h2 className="text-xl font-display font-bold text-text-primary mb-4">
          Add Reminder
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Reminder title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(["task", "study", "break", "custom"] as Reminder["type"][]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`
                    p-3 rounded-lg flex flex-col items-center gap-1 transition-all
                    ${type === t ? `${typeColors[t]} ring-2 ring-current` : "bg-bg-tertiary text-text-secondary"}
                  `}
                >
                  {typeIcons[t]}
                  <span className="text-xs capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Repeat</label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as Reminder["repeat"])}
              className="input"
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Additional details..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Add Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}