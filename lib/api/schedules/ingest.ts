import type { ImportScheduleInput } from "./schemas";
import { prisma } from "@/lib/prisma";

export const MAX_DAYS = 730;

export interface GeneratedTask {
  title: string;
  subject: string;
  targetDate: Date;
  priority: number;
}

export interface ImportResult {
  success: boolean;
  scheduleId?: string;
  taskCount?: number;
  error?: string;
}

export function generateTasksFromSchedule(
  input: ImportScheduleInput,
  startDateArg?: Date
): GeneratedTask[] {
  const startDate = startDateArg ?? new Date();
  const targetDate = new Date(input.targetDate);

  const endOfTargetDay = new Date(targetDate);
  endOfTargetDay.setUTCHours(23, 59, 59, 999);

  if (endOfTargetDay < startDate) {
    return [];
  }

  // Calculate days between start and target, capped at MAX_DAYS
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.min(
    Math.ceil((targetDate.getTime() - startDate.getTime()) / msPerDay) + 1,
    MAX_DAYS
  );

  if (totalDays <= 0 || input.timetable.length === 0) {
    return [];
  }

  const tasks: GeneratedTask[] = [];

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = new Date(startDate.getTime() + dayOffset * msPerDay);
    const cycleDayIndex = dayOffset % input.cycleLengthDays;
    const cycleDayNumber = cycleDayIndex + 1;

    // Find timetable entry for this cycle day
    const dayData = input.timetable.find((d) => d.dayNumber === cycleDayNumber);

    if (!dayData || !dayData.slots || dayData.slots.length === 0) {
      continue;
    }

    // Generate tasks for each slot, prioritizing earlier slots
    dayData.slots.forEach((slot, slotIndex) => {
      const title = slot.topic ? `${slot.topic}` : slot.subject;

      tasks.push({
        title,
        subject: slot.subject,
        targetDate: currentDate,
        priority: slotIndex, // Lower index = higher priority (lower number)
      });
    });
  }

  return tasks;
}

export async function importSchedule(
  userId: string,
  input: ImportScheduleInput
): Promise<ImportResult> {
  try {
    const typedInput = input as ImportScheduleInput & { targetDate: Date };
    const tasks = generateTasksFromSchedule(typedInput, new Date());

    const schedule = await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {},
      });

      const newSchedule = await tx.schedule.create({
        data: {
          title: input.title,
          targetDate: typedInput.targetDate,
          userId: userId,
          data: input as unknown as import("@prisma/client").Prisma.InputJsonValue,
        },
      });

      if (tasks.length > 0) {
        await tx.task.createMany({
          data: tasks.map((task) => ({
            title: task.title,
            subject: task.subject,
            targetDate: task.targetDate,
            priority: task.priority,
            scheduleId: newSchedule.id,
          })),
        });
      }

      return newSchedule;
    });

    return {
      success: true,
      scheduleId: schedule.id,
      taskCount: tasks.length,
    };
  } catch (error) {
    console.error("Import schedule error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export function getSampleSchedule(): ImportScheduleInput {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 180);
  return {
    title: "NEET PG Preparation Schedule",
    description: "Comprehensive study plan for NEET PG examination",
    targetDate: new Date(`${targetDate.toISOString().split("T")[0]}T00:00:00.000Z`),
    cycleLengthDays: 7,
    timetable: [
      { dayNumber: 1, slots: [{ subject: "Anatomy", topic: "General Anatomy" }, { subject: "Physiology" }] },
      { dayNumber: 2, slots: [{ subject: "Biochemistry" }, { subject: "Pathology" }] },
      { dayNumber: 3, slots: [{ subject: "Microbiology" }, { subject: "Pharmacology" }] },
      { dayNumber: 4, slots: [{ subject: "Forensic Medicine" }, { subject: "Medicine" }] },
      { dayNumber: 5, slots: [{ subject: "Surgery" }, { subject: "Obstetrics" }] },
      { dayNumber: 6, slots: [{ subject: "Gynecology" }, { subject: "Pediatrics" }] },
      { dayNumber: 7, slots: [{ subject: "ENT" }, { subject: "Ophthalmology" }] },
    ],
  };
}
