import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { rpName, rpID } from '@/lib/webauthn';
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

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Single device policy: Block if already registered and not requesting logout
    if (user.webAuthnCredentials.length > 0) {
      return NextResponse.json(
        { message: 'A device is already registered to this account. You cannot register a new device.' },
        { status: 403 }
      );
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.email,
      // Require biometric or built-in authenticator
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      // Prevent re-registration of existing credentials
      excludeCredentials: user.webAuthnCredentials.map(cred => ({
        id: new Uint8Array(Buffer.from(cred.credentialId, 'base64url')),
        type: 'public-key' as const,
      })),
    });

    // Store the challenge in a secure cookie to verify later
    cookies().set('webauthn_challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
