import { z } from "zod";

export const TimetableSlotSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().optional(),
});
export type TimetableSlot = z.infer<typeof TimetableSlotSchema>;

export const TimetableDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  slots: z.array(TimetableSlotSchema),
});
export type TimetableDay = z.infer<typeof TimetableDaySchema>;

export const HoursPerDaySchema = z.number().min(0.5).max(24);

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (val: string): boolean => {
  const date = new Date(val);
  return !isNaN(date.getTime()) && DATE_STRING_REGEX.test(val);
};

export interface CycleTimetableValidation {
  outOfRange: number[];
  duplicate: number[];
  missing: number[];
}

// Domain-layer invariant check: the timetable must cover every cycle day
// exactly once, with no out-of-range entries. Kept independent of Zod so
// a future edit flow can re-validate a timetable without round-tripping
// through ImportScheduleSchema.
export function validateCycleTimetable(
  timetable: TimetableDay[],
  cycleLengthDays: number,
): CycleTimetableValidation {
  const counts = new Map<number, number>();
  const outOfRange: number[] = [];
  for (const day of timetable) {
    if (day.dayNumber < 1 || day.dayNumber > cycleLengthDays) {
      outOfRange.push(day.dayNumber);
      continue;
    }
    counts.set(day.dayNumber, (counts.get(day.dayNumber) ?? 0) + 1);
  }
  const duplicate: number[] = [];
  for (const [day, count] of counts) {
    if (count > 1) duplicate.push(day);
  }
  const missing: number[] = [];
  for (let day = 1; day <= cycleLengthDays; day++) {
    if (!counts.has(day)) missing.push(day);
  }
  return {
    outOfRange: outOfRange.sort((a, b) => a - b),
    duplicate: duplicate.sort((a, b) => a - b),
    missing: missing.sort((a, b) => a - b),
  };
}

export const ImportScheduleSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    targetDate: z.string().refine(isValidDateString, {
      message: "targetDate must be a valid date string in YYYY-MM-DD format",
    }),
    cycleLengthDays: z.number().int().min(1).max(366),
    hoursPerDay: HoursPerDaySchema.optional(),
    timetable: z.array(TimetableDaySchema).min(1),
  })
  .superRefine((value, ctx) => {
    const { outOfRange, duplicate, missing } = validateCycleTimetable(
      value.timetable,
      value.cycleLengthDays,
    );
    if (outOfRange.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timetable"],
        message: `Timetable day(s) outside cycle range 1..${value.cycleLengthDays}: ${outOfRange.join(", ")}`,
      });
    }
    if (duplicate.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timetable"],
        message: `Duplicate cycle day(s): ${duplicate.join(", ")}`,
      });
    }
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timetable"],
        message: `Missing cycle day(s): ${missing.join(", ")}`,
      });
    }
  });
export type ImportScheduleInput = z.infer<typeof ImportScheduleSchema>;

export const DEFAULT_HOURS_PER_DAY = 6;

export function getSampleSchedule(): ImportScheduleInput {
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + 180);
  return {
    title: "NEET PG Preparation Schedule",
    description: "Comprehensive study plan for NEET PG examination",
    targetDate: target.toISOString().split("T")[0],
    cycleLengthDays: 7,
    hoursPerDay: 6,
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
