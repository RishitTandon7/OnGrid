import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { markAttendanceSchema } from '@/lib/validators';
import { isPointInPolygon, isAltitudeValid } from '@/lib/geofence';
import { extractIpv4, isSameSubnet } from '@/lib/network';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'STUDENT') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = markAttendanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, lat, lng, altitude, pressure, sensorConfidence } = validation.data;
    const studentId = session.user.id;

    // Get the session with classroom details (including altitude calibration)
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { classroom: true },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      );
    }

    if (!attendanceSession.isActive) {
      return NextResponse.json(
        { message: 'Session is no longer active' },
        { status: 400 }
      );
    }

    // ── 1. Horizontal geofence check (lat/lng polygon) ───────────────────────
    const polygon = attendanceSession.classroom.polygon as {
      lat: number;
      lng: number;
    }[];
    if (!isPointInPolygon({ lat, lng }, polygon)) {
      return NextResponse.json(
        { message: 'You are not within the classroom geofence boundary' },
        { status: 400 }
      );
    }

    // ── 2. Vertical altitude / floor check ───────────────────────────────────
    const classroom = attendanceSession.classroom;
    const altitudeCheck = isAltitudeValid(
      { altitude: altitude ?? null, pressure: pressure ?? null },
      {
        altitudeMeters: classroom.altitudeMeters,
        pressureHpa: classroom.pressureHpa,
        altitudeTolerance: classroom.altitudeTolerance,
      }
    );

    if (!altitudeCheck.valid) {
      const delta = altitudeCheck.deltaMeters != null
        ? Math.abs(altitudeCheck.deltaMeters).toFixed(0)
        : 'unknown';
      const direction = altitudeCheck.deltaMeters != null
        ? (altitudeCheck.deltaMeters > 0 ? 'below' : 'above')
        : '';
      return NextResponse.json(
        {
          message: `Floor mismatch detected — you appear to be ~${delta}m ${direction} the classroom (Floor ${classroom.floor}). Please ensure you are physically in the correct room.`,
          altitudeCheck,
        },
        { status: 400 }
      );
    }

    // ── 3. WiFi subnet check — must be on the same building network as teacher ─
    const rawStudentIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null;
    const ip = extractIpv4(rawStudentIp) ?? rawStudentIp ?? 'unknown';

    const subnetCheck = isSameSubnet(attendanceSession.teacherIp, rawStudentIp);
    if (!subnetCheck.allowed) {
      return NextResponse.json(
        {
          message: `Network mismatch — you must be connected to the campus WiFi in this building to mark attendance. (${subnetCheck.reason})`,
        },
        { status: 403 }
      );
    }

    // ── 4. Duplicate check ───────────────────────────────────────────────────
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'You have already marked attendance for this session' },
        { status: 409 }
      );
    }

    // ── 5. Create attendance record with sensor telemetry ────────────────────
    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId,
        studentId,
        lat,
        lng,
        altitude: altitude ?? null,
        pressure: pressure ?? null,
        sensorConfidence: sensorConfidence ?? null,
        ipAddress: ip,
        deviceFingerprint: body.deviceFingerprint || 'unknown',
      },
    });

    return NextResponse.json(
      { ...record, altitudeMethod: altitudeCheck.method },
      { status: 201 }
    );
  } catch (error) {
    console.error('Attendance marking error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
