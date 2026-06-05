import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { rpID, origin } from '@/lib/webauthn';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Retrieve the challenge from cookies
    const expectedChallenge = cookies().get('webauthn_challenge')?.value;
    if (!expectedChallenge) {
      return NextResponse.json({ message: 'Registration session expired' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

      // Encode credential details properly for Prisma
      // Convert Uint8Array to Base64url (using Buffer)
      const credentialIdStr = Buffer.from(credentialID).toString('base64url');
      const publicKeyStr = Buffer.from(credentialPublicKey).toString('base64url');

      await prisma.$transaction([
        prisma.webAuthnCredential.create({
          data: {
            userId: session.user.id,
            credentialId: credentialIdStr,
            publicKey: publicKeyStr,
            counter,
          },
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            deviceRegisteredAt: new Date(),
            logoutRequested: false, // Reset this if they are registering a new device
          },
        }),
      ]);

      // Clear the challenge cookie
      cookies().delete('webauthn_challenge');

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ message: 'Verification failed' }, { status: 400 });
  } catch (error) {
    console.error('Error verifying registration:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
