-- AlterTable: add optional teacherIp column to AttendanceSession
-- This stores the teacher's IP when they start a session, enabling
-- per-building WiFi subnet validation without a hardcoded CIDR.
ALTER TABLE "AttendanceSession" ADD COLUMN IF NOT EXISTS "teacherIp" TEXT;
