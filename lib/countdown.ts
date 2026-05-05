export type UrgencyLevel = "calm" | "focus" | "urgent" | "critical" | "past";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function daysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
}

export function urgencyLevel(days: number): UrgencyLevel {
  if (days < 0) return "past";
  if (days < 14) return "critical";
  if (days < 30) return "urgent";
  if (days < 60) return "focus";
  return "calm";
}

export function journeyProgress(createdAt: string, targetDate: string): number {
  const start = new Date(createdAt).getTime();
  const target = new Date(targetDate).getTime();
  const total = target - start;
  if (total <= 0) return 100;
  const elapsed = Date.now() - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
