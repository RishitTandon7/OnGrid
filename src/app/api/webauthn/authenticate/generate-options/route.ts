import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { rpID } from '@/lib/webauthn';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { webAuthnCredentials: true },
    });

    if (!user || user.webAuthnCredentials.length === 0) {
      return NextResponse.json({ message: 'No registered device found. Please register your device first.' }, { status: 400 });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.webAuthnCredentials.map(cred => ({
        id: new Uint8Array(Buffer.from(cred.credentialId, 'base64url')),
        type: 'public-key' as const,
      })),
      userVerification: 'required',
    });

    // Store the challenge in a secure cookie to verify later during attendance mark
    cookies().set('webauthn_auth_challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
