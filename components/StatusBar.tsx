"use client";

import { useEffect, useState } from "react";

interface ScheduleSummary {
  title: string;
  targetDate: string;
  createdAt: string;
}

interface UrgencyTone {
  gradient: string;
  text: string;
  subtext: string;
  progressTrack: string;
  progressFill: string;
  border: string;
}

const tones: Record<"calm" | "focus" | "urgent" | "critical" | "past", UrgencyTone> = {
  calm: {
    gradient: "from-accent to-accent-hover",
    text: "text-white",
    subtext: "text-white/85",
    progressTrack: "bg-white/20",
    progressFill: "bg-white",
    border: "border-accent/40",
  },
  focus: {
    gradient: "from-accent to-accent-hover",
    text: "text-white",
    subtext: "text-white/85",
    progressTrack: "bg-white/20",
    progressFill: "bg-white",
    border: "border-accent/40",
  },
  urgent: {
    gradient: "from-warning to-[#FF7B00]",
    text: "text-white",
    subtext: "text-white/90",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
    border: "border-warning/50",
  },
  critical: {
    gradient: "from-danger to-[#D7261C]",
    text: "text-white",
    subtext: "text-white/90",
    progressTrack: "bg-white/25",
    progressFill: "bg-white",
    border: "border-danger/60",
  },
  past: {
    gradient: "from-bg-tertiary to-bg-secondary",
    text: "text-text-secondary",
    subtext: "text-text-muted",
    progressTrack: "bg-bg-tertiary",
    progressFill: "bg-text-muted",
    border: "border-border",
  },
};

function daysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((target.getTime() - now.getTime()) / msPerDay);
}

function urgencyTone(days: number): UrgencyTone {
  if (days < 0) return tones.past;
  if (days < 14) return tones.critical;
  if (days < 30) return tones.urgent;
  if (days < 60) return tones.focus;
  return tones.calm;
}

function journeyProgress(createdAt: string, targetDate: string): number {
  const start = new Date(createdAt).getTime();
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const total = target - start;
  if (total <= 0) return 100;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function formatTarget(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StatusBar() {
  const [schedule, setSchedule] = useState<ScheduleSummary | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.schedule) setSchedule(data.schedule);
      })
      .catch(() => {});
  }, []);

  if (!schedule) {
    return <div className="h-16 bg-bg-secondary border-b border-border" />;
  }

  const days = daysUntil(schedule.targetDate);
  const tone = urgencyTone(days);
  const progress = journeyProgress(schedule.createdAt, schedule.targetDate);
  const isPast = days < 0;
  const countdownNumber = isPast ? Math.abs(days) : days;
  const countdownLabel = isPast
    ? `day${Math.abs(days) === 1 ? "" : "s"} past`
    : days === 0
    ? "the day is here"
    : `day${days === 1 ? "" : "s"} until`;

  return (
    <div
      className={`sticky top-0 z-40 border-b ${tone.border} bg-gradient-to-r ${tone.gradient} shadow-sm`}
      role="status"
      aria-label={`${countdownNumber} ${countdownLabel} ${schedule.title}`}
    >
      <div className="max-w-lg mx-auto px-4 pt-2.5 pb-2 flex items-center gap-3">
        <span
          className={`text-3xl font-display font-extrabold leading-none tabular-nums ${tone.text}`}
          aria-hidden
        >
          {countdownNumber}
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-[11px] font-medium uppercase tracking-wide ${tone.subtext}`}>
            {countdownLabel}
          </span>
          <span className={`block text-sm font-semibold truncate ${tone.text}`}>
            {schedule.title}
          </span>
        </span>
        <span className={`text-[11px] font-medium whitespace-nowrap ${tone.subtext}`}>
          {formatTarget(schedule.targetDate)}
        </span>
      </div>
      <div className={`h-1 ${tone.progressTrack}`}>
        <div
          className={`h-full transition-all duration-500 ${tone.progressFill}`}
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
