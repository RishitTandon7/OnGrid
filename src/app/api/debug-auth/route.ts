import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    return NextResponse.json({
      ok: passwordMatch,
      userId: user.id,
      email: user.email,
      match: passwordMatch,
      hashLength: user.passwordHash.length
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
