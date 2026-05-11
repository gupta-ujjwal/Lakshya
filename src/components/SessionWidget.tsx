import { useEffect, useState } from "react";
import {
  type SessionReflection,
  type TaskPreview,
} from "@/domain/session";
import { endSession, getActiveSession, startSession } from "@/repo";

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

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function SessionWidget({ task, onSessionFinished }: SessionWidgetProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskPreview | null>(null);
  const [startedMs, setStartedMs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // Stopwatch has no "natural" end — default to "stopped because
  // finished" and let the user opt out on the reflection screen.
  const [markComplete, setMarkComplete] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull the open-session state-set into one place so the three entry
  // points (mount-recovery, fresh start, two-tab adoption) can't drift.
  function adoptSession(
    id: string,
    startedAt: string,
    adoptedTask: TaskPreview | null,
  ) {
    const ms = new Date(startedAt).getTime();
    setSessionId(id);
    setActiveTask(adoptedTask);
    setStartedMs(ms);
    setElapsed(Math.max(0, Math.round((Date.now() - ms) / 1000)));
    setPhase("active");
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const active = await getActiveSession();
        if (cancelled || !active) return;
        adoptSession(active.session.id, active.session.startedAt, active.task ?? null);
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
    if (phase !== "active" || startedMs === null) return;
    const tick = () => {
      setElapsed(Math.max(0, Math.round((Date.now() - startedMs) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, startedMs]);

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      const result = await startSession(task ? { taskId: task.id } : {});
      if (!result.ok) {
        // Two-tab adoption: another tab opened a session. Reuse it
        // rather than fail — same recovery contract as the mount path.
        adoptSession(
          result.existing.session.id,
          result.existing.session.startedAt,
          result.existing.task,
        );
        return;
      }
      setMarkComplete(true);
      adoptSession(result.session.id, result.session.startedAt, result.task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  }

  function stopSession() {
    setPhase("reflect");
  }

  async function finishSession(reflection: SessionReflection | null) {
    if (!sessionId) return;
    setSaving(true);
    setError(null);
    try {
      await endSession(sessionId, {
        ...(reflection ? { reflection } : {}),
        markTaskComplete: markComplete && !!activeTask,
      });
      setPhase("idle");
      setSessionId(null);
      setActiveTask(null);
      setStartedMs(null);
      setElapsed(0);
      onSessionFinished?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "active" && activeTask) {
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
          {formatElapsed(elapsed)}
        </p>
        <button
          onClick={stopSession}
          className="mt-4 w-full min-h-[44px] rounded-md border border-border-strong text-text-primary font-medium text-sm active:scale-[0.98] transition-all"
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
          Session ended · {formatElapsed(elapsed)}
        </p>
        <p className="text-base font-semibold text-text-primary">
          How did it go?
        </p>
        {activeTask && (
          <button
            onClick={() => setMarkComplete((v) => !v)}
            className={`mt-3 w-full min-h-[44px] px-3 rounded-md text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
              markComplete
                ? "bg-success-soft border-success/40 text-success"
                : "bg-bg-tertiary border-border text-text-secondary"
            }`}
          >
            <span aria-hidden>{markComplete ? "✓" : "○"}</span>
            <span>
              Mark “{activeTask.title}” as done
            </span>
          </button>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {REFLECTION_OPTIONS.map((opt) => (
            <button
              key={opt.emoji}
              onClick={() => finishSession(opt.emoji)}
              disabled={saving}
              aria-label={opt.label}
              className="flex flex-col items-center gap-1 py-3 rounded-md bg-bg-tertiary/40 hover:bg-bg-tertiary active:scale-95 transition-all disabled:opacity-60 min-h-[44px]"
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
          className="mt-3 w-full min-h-[44px] text-sm text-text-secondary font-medium active:scale-[0.98] transition-all disabled:opacity-60"
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
        className="mt-4 w-full min-h-[48px] rounded-md bg-accent text-white font-semibold text-base active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {starting ? "Starting…" : "Start session"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-danger text-center">{error}</p>
      )}
    </div>
  );
}
