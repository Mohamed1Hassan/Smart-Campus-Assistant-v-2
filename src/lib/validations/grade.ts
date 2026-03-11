import { z } from "zod";

export const assignGradeSchema = z.object({
  studentId: z.number().int().positive(),
  courseId: z.number().int().positive(),
  quizId: z.number().int().positive().optional(),
  score: z.number().min(0),
  maxScore: z.number().positive().default(100),
  type: z.enum(["QUIZ", "EXAM", "ASSIGNMENT", "PARTICIPATION", "OTHER"]),
  notes: z.string().max(500).optional(),
});

export type AssignGradeInput = z.infer<typeof assignGradeSchema>;
