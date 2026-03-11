import { z } from "zod";

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive(),
  name: z.string().min(1),
});

export const securitySettingsSchema = z.object({
  isLocationRequired: z.boolean(),
  isPhotoRequired: z.boolean(),
  isDeviceCheckRequired: z.boolean(),
  fraudDetectionEnabled: z.boolean(),
  maxAttempts: z.number().positive(),
  gracePeriod: z.number().nonnegative(),
  riskThreshold: z.number().min(0).max(100).optional(),
});

export const createSessionSchema = z.object({
  courseId: z.number().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: locationSchema.optional(),
  security: securitySettingsSchema,
});

export const scanQRCodeSchema = z.object({
  sessionId: z.string().uuid(),
  qrCode: z.string().min(1),
  photo: z.string().optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().positive(),
    })
    .optional(),
  deviceFingerprint: z.string().optional(),
});

export const markAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  studentId: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  notes: z.string().optional(),
});
