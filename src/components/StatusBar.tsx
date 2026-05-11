import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { formatDateShortYear } from "@/lib/format";
import { daysUntil, journeyProgress, urgencyLevel } from "@/lib/countdown";
import { statusBarTones } from "@/lib/urgency-tones";
import { getDashboard, type DashboardSchedule } from "@/repo";

interface StatusBarProps {
  // When true, hides the big countdown number + "days until" label.
  // The route's content layer claims the loud countdown surface
  // instead — set by the layout that knows which routes own a hero.
  // StatusBar stays ignorant of routing.
  compact?: boolean;
}

export function StatusBar({ compact = false }: StatusBarProps) {
  const location = useLocation();
  const [schedule, setSchedule] = useState<DashboardSchedule | null>(null);

  // Refetch on every route change: the layout doesn't remount when the
  // user navigates from /import to /, so a once-on-mount fetch leaves
  // the bar stuck on its empty-state placeholder after a fresh import.
  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((data) => {
        if (!cancelled) setSchedule(data?.schedule ?? null);
      })
      .catch(() => {
        // Best-effort: the StatusBar is decorative chrome above every
        // page. If IndexedDB is unavailable (Safari private mode, OS
        // sandbox), the placeholder bar below is the right fallback —
        // better than blocking page render with an alert.
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

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
        {!compact && (
          <span
            className={`text-3xl font-display font-extrabold leading-none tabular-nums ${tone.text}`}
            aria-hidden
          >
            {countdownNumber}
          </span>
        )}
        <span className="flex-1 min-w-0">
          {!compact && (
            <span className={`block text-[11px] font-medium uppercase tracking-wide ${tone.subtext}`}>
              {countdownLabel}
            </span>
          )}
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
