import { z } from "zod";

export const createCourseSchema = z.object({
  courseCode: z.string().min(1, "Course code is required"),
  courseName: z.string().min(1, "Course name is required"),
  description: z.string().optional(),
  credits: z.number().int().min(0).optional().default(3),
  semester: z.enum(["FALL", "SPRING", "SUMMER"]).optional(),
  academicYear: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const enrollStudentSchema = z.object({
  studentId: z.number().int().positive("Student ID must be a positive integer"),
});
