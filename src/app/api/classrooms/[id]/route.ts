import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id: params.id },
    });

    if (!classroom) {
      return NextResponse.json(
        { message: 'Classroom not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(classroom, { status: 200 });
  } catch (error) {
    console.error('Classroom fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const classroom = await prisma.classroom.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(classroom, { status: 200 });
  } catch (error) {
    console.error('Classroom update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.classroom.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Classroom deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Classroom delete error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
