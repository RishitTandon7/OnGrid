import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startSessionSchema } from '@/lib/validators';
import { extractIpv4 } from '@/lib/network';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user?.id;
    const role = session.user?.role;

    const sessions = await prisma.attendanceSession.findMany({
      where:
        role === 'TEACHER'
          ? { teacherId: userId }
          : { records: { some: { studentId: userId } } },
      include: { classroom: true, records: true },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = startSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.issues },
        { status: 400 }
      );
    }

    // Capture teacher's IP at session creation — this becomes the reference
    // subnet for validating students are on the same building network.
    const rawIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null;
    const teacherIp = extractIpv4(rawIp);

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        classroomId: validation.data.classroomId,
        teacherId: session.user.id,
        windowMinutes: validation.data.windowMinutes,
        teacherIp: teacherIp ?? undefined,
      },
      include: { classroom: true },
    });

    return NextResponse.json(attendanceSession, { status: 201 });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
