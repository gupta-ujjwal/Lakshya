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

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (val: string): boolean => {
  const date = new Date(val);
  return !isNaN(date.getTime()) && DATE_STRING_REGEX.test(val);
};

export const ImportScheduleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  targetDate: z.string()
    .refine(isValidDateString, {
      message: "targetDate must be a valid date string in YYYY-MM-DD format",
    })
    .transform((val) => new Date(`${val}T00:00:00.000Z`)),
  cycleLengthDays: z.number().int().min(1).max(366),
  hoursPerDay: z.number().min(0.5).max(24).optional(),
  timetable: z.array(TimetableDaySchema).min(1),
});

export type ImportScheduleInput = z.infer<typeof ImportScheduleSchema>;