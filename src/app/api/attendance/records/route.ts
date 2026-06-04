import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const records = await prisma.attendanceRecord.findMany({
      where:
        role === 'TEACHER'
          ? { session: { teacherId: userId } }
          : { studentId: userId },
      include: {
        session: { include: { classroom: true, teacher: true } },
        student: true,
      },
      orderBy: { markedAt: 'desc' },
    });

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('Attendance records fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
