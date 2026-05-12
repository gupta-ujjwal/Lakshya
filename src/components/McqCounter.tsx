import { useEffect, useRef, useState } from "react";
import { getLast7DayAverage, getTodayCount, setTodayCount } from "@/repo";

// Tap-to-edit number that doubles as the display. Aspirants log MCQs
// in batches of 10-100; ±1 buttons would force fifty taps, so the
// number itself is the input. select-all on focus means typing
// replaces the prior value rather than appending to it.
export function McqCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  // `draft === null` means "not editing" — collapses the old `editing`
  // boolean and `draft` string, which were never independently
  // meaningful (draft was always either empty or the current count's
  // string when editing started).
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pure read — returns the snapshot, leaves state-setting to the
  // caller so the mount effect doesn't trip set-state-in-effect.
  async function readStats() {
    const [today, avg] = await Promise.all([
      getTodayCount(),
      getLast7DayAverage(),
    ]);
    return { count: today, average: avg };
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await readStats();
        if (cancelled) return;
        setCount(stats.count);
        setAverage(stats.average);
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
    if (!Number.isFinite(parsed) || parsed < 0 || parsed === count) return;
    setSaving(true);
    try {
      await setTodayCount(parsed);
      const stats = await readStats();
      setCount(stats.count);
      setAverage(stats.average);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function beginEdit() {
    setDraft(String(count ?? 0));
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
            // disabled during the in-flight save window too — without
            // it, a fast double-tap can re-enter edit mode with stale
            // count before the post-commit readStats lands.
            disabled={count === null || saving}
            data-testid="mcq-counter-display"
            className="font-display text-4xl font-bold text-text-primary tabular-nums min-h-[44px] text-left disabled:opacity-60"
            aria-label={`MCQs solved today: ${count ?? 0}. Tap to edit.`}
          >
            {count ?? "—"}
          </button>
        )}
        <span className="text-xs text-text-muted">
          {average !== null ? `7-day avg: ${average}` : ""}
        </span>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
