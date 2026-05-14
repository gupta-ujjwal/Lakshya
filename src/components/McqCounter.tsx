import { useEffect, useRef, useState } from "react";
import { addToTodayCount, getLast7DayAverage, getTodayCount } from "@/repo";

interface Stats {
  count: number;
  average: number;
}

// Tap the running total to add a batch (e.g. "I just finished a 50-q
// test"). Append-only — typing 20 means +20, not "set to 20" — so
// there's no stale-value race against the displayed count.
export function McqCounter() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function readStats(): Promise<Stats> {
    const [count, average] = await Promise.all([
      getTodayCount(),
      getLast7DayAverage(),
    ]);
    return { count, average };
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await readStats();
        if (cancelled) return;
        setStats(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function commit() {
    if (draft === null) return;
    const parsed = parseInt(draft, 10);
    setDraft(null);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      await addToTodayCount(parsed);
      setStats(await readStats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function beginEdit() {
    setDraft("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const count = stats?.count ?? 0;
  const editing = draft !== null;

  return (
    <div data-testid="mcq-counter" className="card p-4 animate-fade-in">
      <p className="text-xs font-semibold text-accent-strong uppercase tracking-wide mb-1">
        MCQs solved today
      </p>
      <div className="flex items-baseline gap-3 flex-wrap">
        {editing ? (
          <>
            <span
              className="font-display text-4xl font-bold text-text-primary tabular-nums"
              data-testid="mcq-counter-running-total"
            >
              {count}
            </span>
            <span
              className="font-display text-3xl text-text-muted leading-none"
              aria-hidden
            >
              +
            </span>
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="0"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setDraft(null);
              }}
              disabled={saving}
              data-testid="mcq-counter-input"
              className="font-display text-4xl font-bold text-accent-strong tabular-nums bg-transparent w-24 focus:outline-none focus:ring-2 focus:ring-accent-strong rounded-sm"
              aria-label="MCQs to add"
            />
          </>
        ) : (
          <>
            <button
              onClick={beginEdit}
              disabled={stats === null || saving}
              data-testid="mcq-counter-display"
              className="font-display text-4xl font-bold text-text-primary tabular-nums min-h-[44px] text-left disabled:opacity-60"
              aria-label={`${count} MCQs solved today. Tap to log more.`}
            >
              {stats === null ? "—" : count}
            </button>
            {stats !== null && (
              <DeltaIndicator count={stats.count} average={stats.average} />
            )}
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function DeltaIndicator({
  count,
  average,
}: {
  count: number;
  average: number;
}) {
  // No baseline yet (first week of use) or nothing logged today —
  // surface the avg without a misleading green/red verdict.
  if (count === 0 || average === 0) {
    return (
      <span className="text-xs text-text-muted" data-testid="mcq-counter-meta">
        7-day avg: {average}
      </span>
    );
  }
  const delta = count - average;
  if (delta === 0) {
    return (
      <span className="text-xs text-text-muted" data-testid="mcq-counter-meta">
        on pace · 7-day avg {average}
      </span>
    );
  }
  const ahead = delta > 0;
  return (
    <span
      className={`text-xs font-semibold ${ahead ? "text-success" : "text-warning"}`}
      data-testid="mcq-counter-meta"
    >
      <span aria-hidden>{ahead ? "▲" : "▼"}</span> {Math.abs(delta)}{" "}
      {ahead ? "above" : "below"} 7-day avg ({average})
    </span>
  );
}
