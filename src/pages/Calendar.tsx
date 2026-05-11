import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fromDateKey, today } from "@/lib/dates";
import { encodeTaskDate } from "@/lib/task-date-param";
import { getCalendarSummary, type CalendarDay, type CalendarHeat } from "@/repo";

const HEAT_TONES: Record<CalendarHeat, string> = {
  empty: "bg-bg-secondary text-text-muted",
  future: "bg-bg-tertiary/50 text-text-secondary",
  todo: "bg-accent-soft text-accent",
  partial: "bg-warning-soft text-warning",
  done: "bg-success-soft text-success",
  overdue: "bg-danger-soft text-danger",
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function shiftMonth(monthKey: string, delta: number): string {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function formatMonth(monthKey: string): string {
  const date = fromDateKey(`${monthKey}-01`);
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CalendarPage() {
  const navigate = useNavigate();
  const todayKey = today();

  const [monthKey, setMonthKey] = useState(() => todayKey.slice(0, 7));
  const [days, setDays] = useState<CalendarDay[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCalendarSummary(monthKey).then((d) => {
      if (!cancelled) setDays(d);
    });
    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  const leadingBlanks = useMemo(() => {
    if (!days || days.length === 0) return 0;
    return fromDateKey(days[0].date).getUTCDay();
  }, [days]);

  if (days === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2 flex items-center justify-between gap-2">
        <button
          onClick={() => setMonthKey((k) => shiftMonth(k, -1))}
          aria-label="Previous month"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-bg-tertiary text-text-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-display font-semibold text-text-primary tabular-nums">
          {formatMonth(monthKey)}
        </h1>
        <button
          onClick={() => setMonthKey((k) => shiftMonth(k, 1))}
          aria-label="Next month"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-bg-tertiary text-text-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </header>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="text-[11px] font-semibold uppercase text-text-muted text-center pb-1"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} aria-hidden />
        ))}
        {days.map((d) => {
          const isToday = d.date === todayKey;
          const dayNum = Number(d.date.slice(8, 10));
          const tone = HEAT_TONES[d.heat];
          return (
            <button
              key={d.date}
              onClick={() => navigate(`/tasks?${encodeTaskDate(d.date)}`)}
              disabled={d.total === 0}
              className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-transform active:scale-95 disabled:cursor-default ${tone} ${
                isToday ? "ring-2 ring-text-primary" : ""
              }`}
            >
              <span className="font-display text-sm leading-none tabular-nums">
                {dayNum}
              </span>
              {d.total > 0 && (
                <span className="leading-none tabular-nums">
                  {d.completed}/{d.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <CalendarLegend />
    </div>
  );
}

function CalendarLegend() {
  const items: ReadonlyArray<{ heat: CalendarHeat; label: string }> = [
    { heat: "done", label: "All done" },
    { heat: "partial", label: "Partial" },
    { heat: "overdue", label: "Missed" },
    { heat: "todo", label: "Today" },
    { heat: "future", label: "Upcoming" },
    { heat: "empty", label: "No tasks" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-text-secondary">
      {items.map((it) => (
        <span key={it.heat} className="inline-flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-sm ${HEAT_TONES[it.heat]}`} aria-hidden />
          {it.label}
        </span>
      ))}
    </div>
  );
}
