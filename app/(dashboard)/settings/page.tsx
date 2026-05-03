"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Settings {
  theme: "light" | "dark" | "system";
  notifications: {
    enabled: boolean;
    taskReminders: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  schedule: {
    studyHoursStart: string;
    studyHoursEnd: string;
    breakDuration: number;
    sessionsPerDay: number;
  };
  display: {
    showSubjectColors: boolean;
    compactMode: boolean;
    weekStartsOn: "sunday" | "monday";
  };
}

const defaultSettings: Settings = {
  theme: "system",
  notifications: {
    enabled: true,
    taskReminders: true,
    dailyDigest: false,
    weeklyReport: true,
  },
  schedule: {
    studyHoursStart: "08:00",
    studyHoursEnd: "20:00",
    breakDuration: 15,
    sessionsPerDay: 4,
  },
  display: {
    showSubjectColors: true,
    compactMode: false,
    weekStartsOn: "monday",
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "schedule" | "display" | "data">("general");

  useEffect(() => {
    const saved = localStorage.getItem("lakshya-settings");
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed) {
      setSettings(parsed);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("lakshya-settings", JSON.stringify(settings));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const updateSettings = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNotifications = (
    key: keyof Settings["notifications"],
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateSchedule = (key: keyof Settings["schedule"], value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [key]: value },
    }));
  };

  const updateDisplay = (key: keyof Settings["display"], value: boolean | string) => {
    setSettings((prev) => ({
      ...prev,
      display: { ...prev.display, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <Header
        title="Settings"
        subtitle="Customize your experience"
        actions={
          <>
            <ThemeToggle />
            <button onClick={handleSave} className="btn btn-primary">
              {savedMessage ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="w-full md:w-56 flex-shrink-0">
          <div className="card p-2">
            {(["general", "schedule", "display", "data"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  w-full px-4 py-2.5 text-left text-sm font-medium rounded-lg transition-all capitalize
                  ${
                    activeTab === tab
                      ? "bg-accent-soft text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  }
                `}
              >
                {tab === "general" ? "General" : tab === "display" ? "Display" : tab}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1">
          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
                  Appearance
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Theme</p>
                      <p className="text-sm text-text-secondary">
                        Choose your preferred color scheme
                      </p>
                    </div>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSettings("theme", e.target.value as Settings["theme"])}
                      className="input w-auto"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
                  Notifications
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Enable Notifications</p>
                      <p className="text-sm text-text-secondary">
                        Receive reminders and updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.enabled}
                        onChange={(e) => updateNotifications("enabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Task Reminders</p>
                      <p className="text-sm text-text-secondary">
                        Get notified before tasks are due
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.taskReminders}
                        onChange={(e) => updateNotifications("taskReminders", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Daily Digest</p>
                      <p className="text-sm text-text-secondary">
                        Morning summary of your tasks
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.dailyDigest}
                        onChange={(e) => updateNotifications("dailyDigest", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">Weekly Report</p>
                      <p className="text-sm text-text-secondary">
                        Progress summary every Sunday
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.weeklyReport}
                        onChange={(e) => updateNotifications("weeklyReport", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
                Study Schedule
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Study Hours Start
                    </label>
                    <input
                      type="time"
                      value={settings.schedule.studyHoursStart}
                      onChange={(e) => updateSchedule("studyHoursStart", e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Study Hours End
                    </label>
                    <input
                      type="time"
                      value={settings.schedule.studyHoursEnd}
                      onChange={(e) => updateSchedule("studyHoursEnd", e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.schedule.breakDuration}
                    onChange={(e) => updateSchedule("breakDuration", parseInt(e.target.value))}
                    className="input"
                    min={5}
                    max={60}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Study Sessions Per Day
                  </label>
                  <input
                    type="number"
                    value={settings.schedule.sessionsPerDay}
                    onChange={(e) => updateSchedule("sessionsPerDay", parseInt(e.target.value))}
                    className="input"
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "display" && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
                Display Options
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Subject Colors</p>
                    <p className="text-sm text-text-secondary">
                      Show color-coded badges for subjects
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.display.showSubjectColors}
                      onChange={(e) => updateDisplay("showSubjectColors", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Compact Mode</p>
                    <p className="text-sm text-text-secondary">
                      Reduce spacing for denser layout
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.display.compactMode}
                      onChange={(e) => updateDisplay("compactMode", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">Week Starts On</p>
                    <p className="text-sm text-text-secondary">
                      First day of the week in calendars
                    </p>
                  </div>
                  <select
                    value={settings.display.weekStartsOn}
                    onChange={(e) => updateDisplay("weekStartsOn", e.target.value)}
                    className="input w-auto"
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
                  Import Schedule
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  Import your study schedule from a JSON file
                </p>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-border-strong transition-colors cursor-pointer">
                  <svg className="w-10 h-10 mx-auto mb-3 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-text-secondary">Drag and drop or click to upload</p>
                  <p className="text-xs text-text-tertiary mt-1">JSON files only</p>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
                  Export Data
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  Download your schedules, tasks, and notes
                </p>
                <button className="btn btn-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export All Data
                </button>
              </div>

              <div className="card p-6 border-danger/50">
                <h2 className="text-lg font-display font-semibold text-danger mb-4">
                  Danger Zone
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                  Permanently delete all your data. This action cannot be undone.
                </p>
                <button className="btn bg-danger text-white hover:bg-danger/90">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete All Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}