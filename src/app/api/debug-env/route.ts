import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || '';
  const nextAuthUrl = process.env.NEXTAUTH_URL || '';

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: {
      exists: dbUrl.length > 0,
      length: dbUrl.length,
      startsWith: dbUrl ? dbUrl.substring(0, 15) : null,
    },
    NEXTAUTH_SECRET: {
      exists: nextAuthSecret.length > 0,
      length: nextAuthSecret.length,
    },
    NEXTAUTH_URL: {
      exists: nextAuthUrl.length > 0,
      value: nextAuthUrl,
    },
  });
}
