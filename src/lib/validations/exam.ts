import { z } from "zod";

export const scheduleExamSchema = z
  .object({
    courseId: z.number().int().positive(),
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start time",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end time",
    }),
    room: z.string().max(50).optional(),
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type ScheduleExamInput = z.infer<typeof scheduleExamSchema>;
