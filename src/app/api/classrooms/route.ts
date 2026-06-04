import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { classroomSchema } from '@/lib/validators';

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

    const classrooms = await prisma.classroom.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(classrooms, { status: 200 });
  } catch (error) {
    console.error('Classrooms fetch error:', error);
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
    const validation = classroomSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.issues },
        { status: 400 }
      );
    }

    const {
      name,
      label,
      polygon,
      floor,
      building,
      altitudeMeters,
      pressureHpa,
      altitudeTolerance,
    } = validation.data;

    const classroom = await prisma.classroom.create({
      data: {
        name,
        label,
        polygon,
        floor,
        building,
        // Altitude calibration — optional, set when teacher captures sensors
        altitudeMeters: altitudeMeters ?? null,
        pressureHpa: pressureHpa ?? null,
        altitudeTolerance: altitudeTolerance ?? 4.0,
      },
    });

    return NextResponse.json(classroom, { status: 201 });
  } catch (error) {
    console.error('Classroom creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
