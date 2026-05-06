import { useEffect, useState } from "react";
import {
  DEFAULT_FOCUS_MINUTES,
  type SessionReflection,
  type TaskPreview,
} from "@/domain/session";
import {
  endSession,
  getActiveSession,
  startSession,
  SessionAlreadyActiveError,
} from "@/repo";

interface SessionWidgetProps {
  task: TaskPreview | null;
  onSessionFinished?: () => void;
}

type Phase = "idle" | "active" | "reflect";

const REFLECTION_OPTIONS: ReadonlyArray<{
  emoji: SessionReflection;
  label: string;
}> = [
  { emoji: "💪", label: "Crushed it" },
  { emoji: "🙂", label: "Steady" },
  { emoji: "😩", label: "Struggled" },
];

function formatRemaining(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SessionWidget({ task, onSessionFinished }: SessionWidgetProps) {
  const focusSeconds = DEFAULT_FOCUS_MINUTES * 60;
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskPreview | null>(null);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(focusSeconds);
  const [completedNaturally, setCompletedNaturally] = useState(false);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const active = await getActiveSession();
        if (cancelled || !active) return;
        const totalSeconds = active.session.focusMinutes * 60;
        const startedMs = new Date(active.session.startedAt).getTime();
        const target = startedMs + totalSeconds * 1000;
        setSessionId(active.session.id);
        setActiveTask(active.task ?? null);
        if (Date.now() >= target) {
          setRemaining(0);
          setCompletedNaturally(true);
          setPhase("reflect");
          return;
        }
        setEndsAt(target);
        setRemaining(Math.round((target - Date.now()) / 1000));
        setPhase("active");
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? `Could not recover session: ${err.message}`
            : "Could not recover session",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "active" || endsAt === null) return;
    const tick = () => {
      const left = Math.round((endsAt - Date.now()) / 1000);
      if (left <= 0) {
        setRemaining(0);
        setCompletedNaturally(true);
        setPhase("reflect");
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, endsAt]);

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      const result = await startSession(task ? { taskId: task.id } : {});
      const totalSeconds = result.session.focusMinutes * 60;
      const startedMs = new Date(result.session.startedAt).getTime();
      setSessionId(result.session.id);
      setActiveTask(result.task);
      setRemaining(totalSeconds);
      setCompletedNaturally(false);
      setEndsAt(startedMs + totalSeconds * 1000);
      setPhase("active");
    } catch (err) {
      // If the user opened two tabs and pressed Start in both, recover by
      // adopting the existing open session — the same path /api/sessions
      // returned via 409+session before this migration.
      if (err instanceof SessionAlreadyActiveError) {
        const totalSeconds = err.active.session.focusMinutes * 60;
        const startedMs = new Date(err.active.session.startedAt).getTime();
        setSessionId(err.active.session.id);
        setActiveTask(err.active.task);
        setRemaining(Math.max(0, totalSeconds - Math.round((Date.now() - startedMs) / 1000)));
        setEndsAt(startedMs + totalSeconds * 1000);
        setPhase("active");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  }

  function stopEarly() {
    setCompletedNaturally(false);
    setPhase("reflect");
  }

  async function finishSession(reflection: SessionReflection | null) {
    if (!sessionId) return;
    setSaving(true);
    setError(null);
    try {
      await endSession(sessionId, {
        ...(reflection ? { reflection } : {}),
        markTaskComplete: completedNaturally,
      });
      setPhase("idle");
      setSessionId(null);
      setActiveTask(null);
      setEndsAt(null);
      onSessionFinished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "active" && activeTask) {
    const progress = 1 - remaining / focusSeconds;
    return (
      <div
        data-testid="session-widget-active"
        className="card p-5 bg-gradient-to-br from-accent/15 to-accent/5 animate-fade-in text-center"
      >
        <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
          Focusing
        </p>
        <h2 className="text-base font-display font-semibold text-text-primary leading-snug">
          {activeTask.title}
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">{activeTask.subject}</p>
        <p
          data-testid="session-timer"
          className="mt-4 font-display text-5xl font-bold text-text-primary tabular-nums"
        >
          {formatRemaining(remaining)}
        </p>
        <div className="progress-bar mt-3 h-1.5">
          <div
            className="progress-bar-fill h-1.5"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <button
          onClick={stopEarly}
          className="mt-4 w-full h-11 rounded-md border border-border-strong text-text-primary font-medium text-sm active:scale-[0.98] transition-all"
        >
          Stop session
        </button>
      </div>
    );
  }

  if (phase === "reflect") {
    return (
      <div
        data-testid="session-widget-reflect"
        className="card p-5 bg-gradient-to-br from-accent/10 to-accent/5 animate-fade-in"
      >
        <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
          {completedNaturally ? "Session complete" : "Session ended"}
        </p>
        <p className="text-base font-semibold text-text-primary">
          How did it go?
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {REFLECTION_OPTIONS.map((opt) => (
            <button
              key={opt.emoji}
              onClick={() => finishSession(opt.emoji)}
              disabled={saving}
              aria-label={opt.label}
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-bg-tertiary/40 hover:bg-bg-tertiary active:scale-95 transition-all disabled:opacity-60"
            >
              <span className="text-3xl" aria-hidden>{opt.emoji}</span>
              <span className="text-[11px] text-text-secondary">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => finishSession(null)}
          disabled={saving}
          className="mt-3 w-full h-10 text-sm text-text-secondary font-medium active:scale-[0.98] transition-all disabled:opacity-60"
        >
          Skip reflection
        </button>
        {error && (
          <p className="mt-2 text-xs text-danger text-center">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="session-widget-idle"
      className="card p-5 bg-gradient-to-br from-accent/10 to-accent/5 animate-fade-in"
    >
      <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
        Up Next
      </p>
      {task ? (
        <>
          <h2 className="text-lg font-display font-semibold text-text-primary leading-snug">
            {task.title}
          </h2>
          <p className="text-sm text-text-secondary mt-1">{task.subject}</p>
        </>
      ) : (
        <p className="text-sm text-text-secondary">
          No task lined up — start a focus block anyway.
        </p>
      )}
      <button
        onClick={handleStart}
        disabled={starting}
        data-testid="start-session-button"
        className="mt-4 w-full h-12 rounded-md bg-accent text-white font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {starting ? "Starting…" : `Start ${DEFAULT_FOCUS_MINUTES}m session`}
      </button>
      {error && (
        <p className="mt-2 text-xs text-danger text-center">{error}</p>
      )}
    </div>
  );
}
