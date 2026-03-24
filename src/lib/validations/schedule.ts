import { z } from "zod";

export const scheduleSchema = z.object({
  courseId: z.number().int().positive(),
  professorId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  room: z.string().optional(),
  type: z.enum(["Lecture", "Section"]).optional(),
  semester: z.string().optional(),
});

export const updateScheduleSchema = scheduleSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const checkConflictSchema = z.object({
  professorId: z.number().int().positive(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
  excludeScheduleId: z.number().optional(),
});
