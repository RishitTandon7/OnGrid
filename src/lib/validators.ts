import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['TEACHER', 'STUDENT']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string(),
});

export const classroomSchema = z.object({
  name: z.string().min(1, 'Classroom name required'),
  label: z.string().min(1, 'Label required'),
  polygon: z.array(
    z.object({
      lat: z.number(),
      lng: z.number(),
    })
  ),
  floor: z.number().int(),
  building: z.string().min(1, 'Building required'),
  // Altitude calibration fields (optional — set when teacher captures sensor data)
  altitudeMeters: z.number().optional(),
  pressureHpa: z.number().optional(),
  altitudeTolerance: z.number().min(0.5).max(50).optional(),
});

export const startSessionSchema = z.object({
  classroomId: z.string().min(1, 'Classroom ID required'),
  windowMinutes: z.number().int().min(1),
});

export const markAttendanceSchema = z.object({
  sessionId: z.string().min(1, 'Session ID required'),
  lat: z.number(),
  lng: z.number(),
  // Sensor telemetry from student's device
  altitude: z.number().nullable().optional(),
  pressure: z.number().nullable().optional(),
  sensorConfidence: z.number().min(0).max(1).nullable().optional(),
  deviceOrientation: z
    .object({
      alpha: z.number().nullable(),
      beta: z.number().nullable(),
      gamma: z.number().nullable(),
    })
    .optional(),
  isStationary: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ClassroomInput = z.infer<typeof classroomSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
