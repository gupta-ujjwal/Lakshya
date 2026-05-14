import { db, newId, nowIso, type MockSeries, type MockTestRecord } from "@/db";

const RECENT_WINDOW = 5;
const MIN_APPEARANCES = 2;
const MAX_N = 50;

export interface AddMockInput {
  series: MockSeries;
  date: string;
  subjectScores: Record<string, number>;
  total: number;
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export async function addMock(input: AddMockInput): Promise<MockTestRecord> {
  const subjectScores: Record<string, number> = {};
  for (const [subject, score] of Object.entries(input.subjectScores)) {
    subjectScores[subject] = clampScore(score);
  }
  const record: MockTestRecord = {
    id: newId(),
    series: input.series,
    date: input.date,
    subjectScores,
    total: clampScore(input.total),
    createdAt: nowIso(),
  };
  await db.mockTests.put(record);
  return record;
}

export async function listMocks(): Promise<MockTestRecord[]> {
  // Dexie's index orders by `date` alone; tie-break by createdAt in JS
  // so two mocks logged the same day stay deterministic.
  const all = await db.mockTests.toArray();
  return all.sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export async function deleteMock(id: string): Promise<void> {
  await db.mockTests.delete(id);
}

// Returns the n subjects with the lowest mean across the most recent
// RECENT_WINDOW mocks. Subjects appearing in fewer than MIN_APPEARANCES
// of those mocks are excluded — one bad day on Anatomy shouldn't tag
// it weak forever. n is clamped to MAX_N to bound the result size.
export async function weakSubjects(n: number): Promise<string[]> {
  if (!Number.isFinite(n) || n <= 0) return [];
  const cap = Math.min(Math.floor(n), MAX_N);
  const all = await listMocks();
  const recent = all.slice(0, RECENT_WINDOW);
  if (recent.length === 0) return [];

  const sums = new Map<string, { total: number; count: number }>();
  for (const mock of recent) {
    for (const [subject, score] of Object.entries(mock.subjectScores)) {
      const cur = sums.get(subject) ?? { total: 0, count: 0 };
      cur.total += score;
      cur.count += 1;
      sums.set(subject, cur);
    }
  }

  const eligible: { subject: string; mean: number }[] = [];
  for (const [subject, { total, count }] of sums) {
    if (count < MIN_APPEARANCES) continue;
    eligible.push({ subject, mean: total / count });
  }
  eligible.sort(
    (a, b) => a.mean - b.mean || a.subject.localeCompare(b.subject),
  );
  return eligible.slice(0, cap).map((e) => e.subject);
}
