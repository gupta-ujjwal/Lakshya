import { useEffect, useState } from "react";
import { formatDateShortYear } from "@/lib/format";
import { daysUntil, journeyProgress, urgencyLevel } from "@/lib/countdown";
import { statusBarTones } from "@/lib/urgency-tones";
import { getDashboard, type DashboardSchedule } from "@/repo";

export function StatusBar() {
  const [schedule, setSchedule] = useState<DashboardSchedule | null>(null);

  useEffect(() => {
    getDashboard()
      .then((data) => {
        if (data?.schedule) setSchedule(data.schedule);
      })
      .catch(() => {});
  }, []);

  if (!schedule) {
    return <div className="h-16 bg-bg-secondary border-b border-border" />;
  }

  const days = daysUntil(schedule.targetDate);
  const tone = statusBarTones[urgencyLevel(days)];
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
          {formatDateShortYear(schedule.targetDate)}
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
