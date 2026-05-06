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

export const ImportScheduleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  targetDate: z.string().refine(isValidDateString, {
    message: "targetDate must be a valid date string in YYYY-MM-DD format",
  }),
  cycleLengthDays: z.number().int().min(1).max(366),
  hoursPerDay: HoursPerDaySchema.optional(),
  timetable: z.array(TimetableDaySchema).min(1),
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
