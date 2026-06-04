-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "pressure" DOUBLE PRECISION,
ADD COLUMN     "sensorConfidence" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "altitudeMeters" DOUBLE PRECISION,
ADD COLUMN     "altitudeTolerance" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
ADD COLUMN     "pressureHpa" DOUBLE PRECISION;
