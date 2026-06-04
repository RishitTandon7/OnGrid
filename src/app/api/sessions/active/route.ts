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

    // Get active sessions for students to join
    const now = new Date();

    const activeSessions = await prisma.attendanceSession.findMany({
      where: {
        isActive: true,
        startedAt: {
          lte: now,
        },
      },
      include: {
        classroom: true,
        teacher: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(activeSessions, { status: 200 });
  } catch (error) {
    console.error('Active sessions fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
