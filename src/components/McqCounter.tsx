import { useEffect, useRef, useState } from "react";
import { getLast7DayAverage, getTodayCount, setTodayCount } from "@/repo";

interface Stats {
  count: number;
  average: number;
}

// Tap-to-edit number that doubles as the display. Aspirants log MCQs
// in batches of 10-100; ±1 buttons would force fifty taps, so the
// number itself is the input. select-all on focus means typing
// replaces the prior value rather than appending to it.
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
    if (!Number.isFinite(parsed) || parsed < 0 || parsed === stats?.count)
      return;
    setSaving(true);
    try {
      await setTodayCount(parsed);
      setStats(await readStats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function beginEdit() {
    setDraft(String(stats?.count ?? 0));
    // requestAnimationFrame so the input mounts before select() runs.
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  return (
    <div data-testid="mcq-counter" className="card p-4 animate-fade-in">
      <p className="text-xs font-semibold text-accent-strong uppercase tracking-wide mb-1">
        MCQs solved today
      </p>
      <div className="flex items-baseline gap-3">
        {draft !== null ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min={0}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setDraft(null);
            }}
            disabled={saving}
            data-testid="mcq-counter-input"
            className="font-display text-4xl font-bold text-text-primary tabular-nums bg-transparent w-32 focus:outline-none focus:ring-2 focus:ring-accent-strong rounded-sm"
            aria-label="MCQs solved today"
          />
        ) : (
          <button
            onClick={beginEdit}
            // Disabled during the in-flight save window too — without
            // it, a fast double-tap re-enters edit mode with the stale
            // count before the post-commit readStats lands.
            disabled={stats === null || saving}
            data-testid="mcq-counter-display"
            className="font-display text-4xl font-bold text-text-primary tabular-nums min-h-[44px] text-left disabled:opacity-60"
            aria-label={`MCQs solved today: ${stats?.count ?? 0}. Tap to edit.`}
          >
            {stats?.count ?? "—"}
          </button>
        )}
        <span className="text-xs text-text-muted">
          {stats !== null ? `7-day avg: ${stats.average}` : ""}
        </span>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
