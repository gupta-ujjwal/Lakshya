import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MOCK_SERIES, type MockSeries, type MockTestRecord } from "@/db";
import { addMock, deleteMock, listMocks, listSubjects } from "@/repo";
import { today } from "@/lib/dates";
import { formatDateLong } from "@/lib/format";

const SERIES_LABEL: Record<MockSeries, string> = {
  marrow: "Marrow",
  prepladder: "PrepLadder",
  dams: "DAMS",
  other: "Other",
};

interface PageData {
  subjects: string[];
  mocks: MockTestRecord[];
}

export function MocksPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [series, setSeries] = useState<MockSeries>("marrow");
  const [date, setDate] = useState(today());
  const [scores, setScores] = useState<Record<string, string>>({});
  const [total, setTotal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<PageData> {
    const [subjects, mocks] = await Promise.all([listSubjects(), listMocks()]);
    return { subjects, mocks };
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await refresh();
        if (cancelled) return;
        setData(next);
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

  function resetForm() {
    setSeries("marrow");
    setDate(today());
    setScores({});
    setTotal("");
  }

  async function handleSave() {
    if (!data) return;
    setError(null);

    const subjectScores: Record<string, number> = {};
    for (const subject of data.subjects) {
      const raw = scores[subject]?.trim();
      if (!raw) continue;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        setError(`${subject} score must be 0–100`);
        return;
      }
      subjectScores[subject] = parsed;
    }
    if (Object.keys(subjectScores).length === 0) {
      setError("Enter a score for at least one subject");
      return;
    }
    const totalParsed = Number(total.trim());
    if (!Number.isFinite(totalParsed) || totalParsed < 0 || totalParsed > 100) {
      setError("Overall total must be 0–100");
      return;
    }

    setSaving(true);
    try {
      await addMock({ series, date, subjectScores, total: totalParsed });
      const next = await refresh();
      setData(next);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteMock(id);
      const next = await refresh();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (data === null) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  const noSchedule = data.subjects.length === 0;

  return (
    <div className="space-y-4 pb-6">
      <header className="pt-2">
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Mock tests
        </h1>
        <p className="text-sm text-text-secondary">
          Log a mock test by per-subject percentage. Used to surface weak
          subjects across recent attempts.
        </p>
      </header>

      {noSchedule ? (
        <div className="card p-6 text-center text-text-secondary">
          <p>Import a schedule first — the entry form needs your subject list.</p>
          <Link
            to="/import"
            className="mt-3 inline-block text-accent-strong font-medium hover:underline"
          >
            Go to import
          </Link>
        </div>
      ) : (
        <MockEntryForm
          subjects={data.subjects}
          series={series}
          setSeries={setSeries}
          date={date}
          setDate={setDate}
          scores={scores}
          setScores={setScores}
          total={total}
          setTotal={setTotal}
          saving={saving}
          onSave={handleSave}
        />
      )}

      {error && (
        <p
          role="alert"
          className="card p-3 text-sm text-danger bg-danger-soft border border-danger/30"
        >
          {error}
        </p>
      )}

      <MockHistoryList mocks={data.mocks} onDelete={handleDelete} />
    </div>
  );
}

interface MockEntryFormProps {
  subjects: string[];
  series: MockSeries;
  setSeries: (s: MockSeries) => void;
  date: string;
  setDate: (d: string) => void;
  scores: Record<string, string>;
  setScores: (next: Record<string, string>) => void;
  total: string;
  setTotal: (t: string) => void;
  saving: boolean;
  onSave: () => void | Promise<void>;
}

function MockEntryForm({
  subjects,
  series,
  setSeries,
  date,
  setDate,
  scores,
  setScores,
  total,
  setTotal,
  saving,
  onSave,
}: MockEntryFormProps) {
  return (
    <form
      className="card p-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave();
      }}
    >
      <p className="text-xs font-semibold text-accent-strong uppercase tracking-wide">
        Log a mock test
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-text-muted mb-1">Series</span>
          <select
            value={series}
            onChange={(e) => setSeries(e.target.value as MockSeries)}
            disabled={saving}
            className="w-full h-10 rounded-md bg-bg-tertiary border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-strong"
          >
            {MOCK_SERIES.map((s) => (
              <option key={s} value={s}>
                {SERIES_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-text-muted mb-1">Date</span>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            className="w-full h-10 rounded-md bg-bg-tertiary border border-border px-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-strong"
          />
        </label>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-xs text-text-muted mb-1">
          Per-subject score (0–100). Leave blank to skip a subject.
        </legend>
        {subjects.map((subject) => (
          <label
            key={subject}
            className="flex items-center gap-3"
            htmlFor={`mock-score-${subject}`}
          >
            <span className="flex-1 text-sm text-text-primary truncate">
              {subject}
            </span>
            <input
              id={`mock-score-${subject}`}
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="0.1"
              placeholder="—"
              value={scores[subject] ?? ""}
              onChange={(e) =>
                setScores({ ...scores, [subject]: e.target.value })
              }
              disabled={saving}
              className="w-24 h-9 rounded-md bg-bg-tertiary border border-border px-2 text-sm text-right tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-strong"
            />
          </label>
        ))}
      </fieldset>

      <label className="flex items-center gap-3">
        <span className="flex-1 text-sm font-semibold text-text-primary">
          Overall total
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.1"
          placeholder="0–100"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          disabled={saving}
          className="w-24 h-9 rounded-md bg-bg-tertiary border border-border px-2 text-sm text-right tabular-nums text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-strong"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 rounded-md bg-accent-strong text-accent-strong-fg font-semibold text-base disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save mock"}
      </button>
    </form>
  );
}

interface MockHistoryListProps {
  mocks: MockTestRecord[];
  onDelete: (id: string) => void | Promise<void>;
}

function MockHistoryList({ mocks, onDelete }: MockHistoryListProps) {
  if (mocks.length === 0) {
    return (
      <div className="card p-6 text-center text-text-muted text-sm">
        No mocks logged yet.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        History
      </h2>
      <ul className="space-y-2">
        {mocks.map((m) => (
          <li key={m.id}>
            <MockHistoryRow mock={m} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockHistoryRow({
  mock,
  onDelete,
}: {
  mock: MockTestRecord;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const ranked = useMemo(() => {
    const entries = Object.entries(mock.subjectScores);
    if (entries.length === 0) return null;
    entries.sort((a, b) => a[1] - b[1]);
    return { weakest: entries[0], strongest: entries[entries.length - 1] };
  }, [mock.subjectScores]);
  const subjectCount = Object.keys(mock.subjectScores).length;

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {SERIES_LABEL[mock.series]}
          </p>
          <p className="text-xs text-text-muted">{formatDateLong(mock.date)}</p>
        </div>
        <p className="font-display text-2xl font-bold text-text-primary tabular-nums">
          {Math.round(mock.total)}
          <span className="text-xs text-text-muted font-sans font-normal">
            {" "}
            / 100
          </span>
        </p>
      </div>

      <p className="text-xs text-text-muted">
        {subjectCount} subject{subjectCount === 1 ? "" : "s"}
        {ranked && (
          <>
            {" · "}
            <span className="text-warning font-semibold">
              ▼ {ranked.weakest[0]} {Math.round(ranked.weakest[1])}
            </span>
            {ranked.strongest[0] !== ranked.weakest[0] && (
              <>
                {" · "}
                <span className="text-success font-semibold">
                  ▲ {ranked.strongest[0]} {Math.round(ranked.strongest[1])}
                </span>
              </>
            )}
          </>
        )}
      </p>

      <button
        type="button"
        onClick={() => void onDelete(mock.id)}
        className="text-xs text-danger hover:underline"
        aria-label={`Delete ${SERIES_LABEL[mock.series]} mock from ${mock.date}`}
      >
        Delete
      </button>
    </div>
  );
}
