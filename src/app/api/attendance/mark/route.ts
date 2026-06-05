import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { markAttendanceSchema } from '@/lib/validators';
import { isPointInPolygon } from '@/lib/geofence';
import { extractIpv4, isSameSubnet } from '@/lib/network';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { rpID, origin } from '@/lib/webauthn';
import { cookies } from 'next/headers';

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

    const { sessionId, lat, lng, webAuthnAssertion, altitude, pressure, sensorConfidence } = validation.data;
    const studentId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: studentId },
      include: { webAuthnCredentials: true },
    });

    if (!user || user.webAuthnCredentials.length === 0) {
      return NextResponse.json(
        { message: 'You must register a biometric device (Fingerprint/Face ID) before marking attendance.' },
        { status: 403 }
      );
    }

    // Get the session with classroom details
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

    // ── 2. Biometric (WebAuthn) Check ─────────────────────────────────────────
    const expectedChallenge = cookies().get('webauthn_auth_challenge')?.value;
    if (!expectedChallenge) {
      return NextResponse.json(
        { message: 'Biometric session expired. Please refresh the page and try again.' },
        { status: 400 }
      );
    }

    const credentialId = Buffer.from(webAuthnAssertion.id, 'base64url').toString('base64url');
    const credential = user.webAuthnCredentials.find(c => c.credentialId === credentialId);

    if (!credential) {
      return NextResponse.json(
        { message: 'Unrecognized biometric device. You can only use your registered device.' },
        { status: 403 }
      );
    }

    const verification = await verifyAuthenticationResponse({
      response: webAuthnAssertion,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      authenticator: {
        credentialID: new Uint8Array(Buffer.from(credential.credentialId, 'base64url')),
        credentialPublicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64url')),
        counter: credential.counter,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json(
        { message: 'Biometric verification failed.' },
        { status: 403 }
      );
    }

    // Update the counter
    await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    // Clear the challenge
    cookies().delete('webauthn_auth_challenge');

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
        deviceFingerprint: credentialId, // Save the WebAuthn credential ID as the device fingerprint
      },
    });

    return NextResponse.json(
      { ...record },
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
