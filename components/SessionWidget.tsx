"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_FOCUS_MINUTES,
  SessionReflection,
} from "@/lib/api/sessions/schemas";

interface TaskPreview {
  id: string;
  title: string;
  subject: string;
}

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

interface ActiveSessionResponse {
  session: {
    id: string;
    startedAt: string;
    taskId: string | null;
    focusMinutes: number;
  } | null;
  task?: TaskPreview | null;
}

interface StartSessionResponse {
  session: { id: string; startedAt: string; focusMinutes: number };
  task: TaskPreview | null;
}

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

  // Rehydrate any open session on mount so a page reload during a focus
  // block resumes the timer (or jumps to reflect if the block has elapsed)
  // instead of orphaning the Session row. A 404 means "no open session" —
  // silent idle is correct. Other failures (auth, 5xx, network) surface so
  // the user knows their session may not have been recovered.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sessions/active");
        if (!res.ok) {
          if (!cancelled && res.status !== 404) {
            setError(`Could not recover session (HTTP ${res.status})`);
          }
          return;
        }
        const data = (await res.json()) as ActiveSessionResponse;
        if (cancelled || !data.session) return;
        const totalSeconds = data.session.focusMinutes * 60;
        const startedMs = new Date(data.session.startedAt).getTime();
        const target = startedMs + totalSeconds * 1000;
        setSessionId(data.session.id);
        setActiveTask(data.task ?? null);
        if (Date.now() >= target) {
          setRemaining(0);
          setCompletedNaturally(true);
          setPhase("reflect");
        } else {
          setEndsAt(target);
          setRemaining(Math.round((target - Date.now()) / 1000));
          setPhase("active");
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? `Could not recover session: ${err.message}`
            : "Could not recover session"
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

  async function startSession() {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task ? { taskId: task.id } : {}),
      });
      if (!res.ok) throw new Error("Could not start session");
      const data = (await res.json()) as StartSessionResponse;
      const totalSeconds = data.session.focusMinutes * 60;
      const startedMs = new Date(data.session.startedAt).getTime();
      setSessionId(data.session.id);
      setActiveTask(data.task);
      setRemaining(totalSeconds);
      setCompletedNaturally(false);
      setEndsAt(startedMs + totalSeconds * 1000);
      setPhase("active");
    } catch (err) {
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
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(reflection ? { reflection } : {}),
          markTaskComplete: completedNaturally,
        }),
      });
      if (!res.ok) throw new Error("Could not save session");
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
        onClick={startSession}
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
