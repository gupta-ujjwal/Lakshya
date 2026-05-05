"use client";

import { daysUntil, urgencyLevel } from "@/lib/countdown";
import { heroTones } from "@/lib/urgency-tones";

interface DaysLeftHeroProps {
  title: string;
  targetDate: string;
  hoursPerDay: number;
}

function buildHeadline(days: number, title: string): string {
  if (days < 0) return `day${Math.abs(days) === 1 ? "" : "s"} past target`;
  if (days === 0) return "the day is here";
  return `day${days === 1 ? "" : "s"} until ${title}`;
}

export function DaysLeftHero({ title, targetDate, hoursPerDay }: DaysLeftHeroProps) {
  const days = daysUntil(targetDate);
  const level = urgencyLevel(days);
  const tone = heroTones[level];
  const isPast = days < 0;
  const remainingDays = Math.max(0, days);
  const hoursRemaining = Math.round(remainingDays * hoursPerDay);
  const numberDisplay = Math.abs(days);
  const headline = buildHeadline(days, title);

  return (
    <section
      data-testid="days-left-hero"
      className={`relative overflow-hidden rounded-md bg-gradient-to-br ${tone.gradient} ring-1 ${tone.ring} shadow-md animate-fade-in`}
      aria-label={`${numberDisplay} ${headline}`}
    >
      <div className="px-5 pt-5 pb-4">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.14em] mb-1 ${tone.eyebrow}`}
        >
          {isPast ? "Target passed" : "Countdown"}
        </p>

        <div className="flex items-baseline gap-3">
          <span
            className={`text-6xl font-display font-extrabold leading-none tabular-nums tracking-tight ${tone.number}`}
          >
            {numberDisplay}
          </span>
          <span
            className={`text-base font-semibold leading-tight ${tone.headline}`}
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
