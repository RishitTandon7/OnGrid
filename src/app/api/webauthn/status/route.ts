import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ isRegistered: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { webAuthnCredentials: true },
    });

    if (!user) {
      return NextResponse.json({ isRegistered: false }, { status: 404 });
    }

    return NextResponse.json({
      isRegistered: user.webAuthnCredentials.length > 0,
      registeredAt: user.deviceRegisteredAt,
      logoutRequested: user.logoutRequested,
    });
  } catch (error) {
    console.error('Error fetching WebAuthn status:', error);
    return NextResponse.json({ isRegistered: false }, { status: 500 });
  }
}
