import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters long"),
  universityId: z
    .string()
    .min(5, "University ID must be at least 5 characters long"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  role: z.enum(["student", "professor", "admin"]).optional(),
  name: z.string().optional(),
  major: z.string().optional(),
  level: z.number().int().optional(),
});

export const loginSchema = z.object({
  universityId: z.string().min(1, "University ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
