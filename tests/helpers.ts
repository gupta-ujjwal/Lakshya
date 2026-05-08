import { db } from "@/db";

export async function clearDb(): Promise<void> {
  await Promise.all([
    db.schedules.clear(),
    db.tasks.clear(),
    db.taskProgress.clear(),
    db.sessions.clear(),
  ]);
}
