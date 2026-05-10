import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  listTasks,
  PROGRESS_COMPLETED,
  PROGRESS_PENDING,
  recordTaskProgress,
  type TaskWithProgress,
} from "@/repo";
import { formatDateLong } from "@/lib/format";
import {
  getPinnedSubjects,
  isSubjectPinned,
  pinSubject,
  unpinSubject,
} from "@/lib/focus-pin";

// Letter-tile icon: deterministic colour from a string hash so the
// same subject renders the same swatch across views, with no curated
// icon map to maintain. The first letter is the readable affordance.
function tileHue(subject: string): number {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = (hash * 31 + subject.charCodeAt(i)) | 0;
  }
  return ((hash % 360) + 360) % 360;
}

function LetterTile({
  subject,
  size = "md",
}: {
  subject: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "w-14 h-14 text-2xl" : size === "sm" ? "w-9 h-9 text-sm" : "w-12 h-12 text-lg";
  return (
    <span
      aria-hidden
      className={`${dim} rounded-xl flex items-center justify-center text-white font-display font-bold flex-shrink-0`}
      style={{ backgroundColor: `hsl(${tileHue(subject)}, 55%, 42%)` }}
    >
      {subject.charAt(0).toUpperCase()}
    </span>
  );
}

interface SubjectStat {
  subject: string;
  total: number;
  completed: number;
}

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectStat[] | null>(null);
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // One listTasks call across the whole schedule, then a single
      // group-by — N parallel calls were doing the same task×progress
      // join N times. Order subjects alphabetically (matches the
      // original listSubjects() contract).
      const all = await listTasks({});
      const byName = new Map<string, SubjectStat>();
      for (const t of all) {
        const cur =
          byName.get(t.subject) ??
          { subject: t.subject, total: 0, completed: 0 };
        cur.total += 1;
        if (t.status === "completed") cur.completed += 1;
        byName.set(t.subject, cur);
      }
      const stats = Array.from(byName.values()).sort((a, b) =>
        a.subject.localeCompare(b.subject),
      );
      if (cancelled) return;
      setSubjects(stats);
      setPinned(getPinnedSubjects());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (subjects === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="space-y-4 pb-6">
        <header className="pt-2">
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Subjects
          </h1>
        </header>
        <div className="card p-6 text-center text-text-secondary">
          <p>No subjects yet — import a schedule to populate this list.</p>
          <Link
            to="/import"
            className="mt-3 inline-block text-accent font-medium hover:underline"
          >
            Go to import
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2">
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Subjects
        </h1>
        <p className="text-sm text-text-secondary">
          Drill into a subject to see its tasks or pin it for today.
        </p>
      </header>

      {pinned.length > 0 && (
        <div className="card p-3 bg-accent-soft/40 border border-accent/30">
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-accent">Today’s focus:</span>{" "}
            {pinned.join(", ")}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {subjects.map((s) => {
          const pct =
            s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
          const isPinned = pinned.includes(s.subject);
          return (
            <li key={s.subject}>
              <Link
                to={`/subjects/${encodeURIComponent(s.subject)}`}
                className="card p-4 flex items-center gap-3 hover:bg-bg-tertiary/40 transition-colors"
              >
                <LetterTile subject={s.subject} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="block text-sm font-semibold text-text-primary truncate">
                      {s.subject}
                    </span>
                    {isPinned && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent-soft px-1.5 py-0.5 rounded">
                        Pinned
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-text-muted mt-0.5">
                    {s.completed}/{s.total} done · {pct}%
                  </span>
                  <span className="progress-bar mt-1.5 h-1 block">
                    <span
                      className="progress-bar-fill h-1 block"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SubjectDetailPage() {
  const { subject: rawSubject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const subject = rawSubject ? decodeURIComponent(rawSubject) : "";

  const [tasks, setTasks] = useState<TaskWithProgress[] | null>(null);
  const [pinned, setPinned] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!subject) {
      navigate("/subjects", { replace: true });
      return;
    }
    let cancelled = false;
    void (async () => {
      const t = await listTasks({ subjects: [subject] });
      if (cancelled) return;
      setTasks(t);
      setPinned(isSubjectPinned(subject));
    })();
    return () => {
      cancelled = true;
    };
  }, [subject, navigate]);

  function togglePin() {
    if (pinned) {
      unpinSubject(subject);
      setPinned(false);
    } else {
      pinSubject(subject);
      setPinned(true);
    }
  }

  async function toggleTask(task: TaskWithProgress) {
    const next =
      task.status === "completed" ? PROGRESS_PENDING : PROGRESS_COMPLETED;
    setPendingIds((s) => new Set(s).add(task.id));
    setTasks((prev) =>
      prev
        ? prev.map((t) =>
            t.id === task.id
              ? { ...t, status: next === PROGRESS_COMPLETED ? "completed" : "todo" }
              : t,
          )
        : prev,
    );
    try {
      await recordTaskProgress(task.id, next);
    } catch {
      setTasks((prev) =>
        prev
          ? prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
          : prev,
      );
    } finally {
      setPendingIds((s) => {
        const n = new Set(s);
        n.delete(task.id);
        return n;
      });
    }
  }

  if (tasks === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2">
        <Link
          to="/subjects"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          All subjects
        </Link>
        <div className="flex items-center gap-3">
          <LetterTile subject={subject} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-text-primary truncate">
              {subject}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              {completed}/{total} done · {pct}%
            </p>
          </div>
        </div>
        <div className="progress-bar mt-3 h-2">
          <div className="progress-bar-fill h-2" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <button
        onClick={togglePin}
        data-testid="pin-subject-button"
        className={`w-full min-h-[48px] rounded-xl font-semibold text-base transition-all duration-150 active:scale-[0.98] ${
          pinned
            ? "bg-success-soft border border-success/40 text-success"
            : "bg-accent text-white hover:bg-accent-hover shadow-md"
        }`}
      >
        {pinned ? "✓ Pinned for today — tap to unpin" : "Study this subject today"}
      </button>

      <div className="card p-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
            No tasks for this subject.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => {
              const completed = task.status === "completed";
              const overdue = task.status === "overdue";
              return (
                <li key={task.id}>
                  <button
                    onClick={() => void toggleTask(task)}
                    disabled={pendingIds.has(task.id)}
                    className="w-full flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-bg-tertiary/50 transition-colors text-left disabled:opacity-60"
                  >
                    <span
                      className="w-11 h-11 -m-2 flex-shrink-0 flex items-center justify-center"
                      aria-hidden
                    >
                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          completed
                            ? "bg-success border-success text-white"
                            : overdue
                              ? "border-danger"
                              : "border-border-strong"
                        }`}
                      >
                        {completed && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-sm font-medium truncate ${
                          completed
                            ? "line-through text-text-muted"
                            : "text-text-primary"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="block text-xs text-text-muted">
                        {formatDateLong(task.targetDate)}
                      </span>
                    </span>
                    {overdue && (
                      <span className="text-[10px] font-semibold uppercase text-danger">
                        Overdue
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
