"use client";

import { daysUntil, urgencyLevel } from "@/lib/countdown";
import { heroTones } from "@/lib/urgency-tones";

interface DaysLeftHeroProps {
  title: string;
  targetDate: string;
  hoursPerDay: number;
}

export function DaysLeftHero({ title, targetDate, hoursPerDay }: DaysLeftHeroProps) {
  const days = daysUntil(targetDate);
  const level = urgencyLevel(days);
  const tone = heroTones[level];
  const isPast = days < 0;
  const remainingDays = Math.max(0, days);
  const hoursRemaining = Math.round(remainingDays * hoursPerDay);
  const numberDisplay = isPast ? Math.abs(days) : days;
  const headline = isPast
    ? `day${Math.abs(days) === 1 ? "" : "s"} past target`
    : days === 0
    ? "the day is here"
    : `day${days === 1 ? "" : "s"} until ${title}`;
  const isMuted = level === "past";

  return (
    <section
      data-testid="days-left-hero"
      className={`relative overflow-hidden rounded-md bg-gradient-to-br ${tone.gradient} ring-1 ${tone.ring} shadow-md animate-fade-in`}
      aria-label={`${numberDisplay} ${headline}`}
    >
      <div className="px-5 pt-5 pb-4">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.14em] mb-1 ${
            isMuted ? "text-text-muted" : "text-white/85"
          }`}
        >
          {isPast ? "Target passed" : "Countdown"}
        </p>

        <div className="flex items-baseline gap-3">
          <span
            className={`text-6xl font-display font-extrabold leading-none tabular-nums tracking-tight ${
              isMuted ? "text-text-secondary" : "text-white"
            }`}
          >
            {numberDisplay}
          </span>
          <span
            className={`text-base font-semibold leading-tight ${
              isMuted ? "text-text-secondary" : "text-white/95"
            }`}
          >
            {headline}
          </span>
        </div>

        {!isPast && (
          <div
            className={`mt-4 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ${tone.hours}`}
          >
            <span aria-hidden>⏱</span>
            <span className="tabular-nums">
              {remainingDays} × {hoursPerDay} hrs/day = {hoursRemaining} study hours left
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
