'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role === 'TEACHER') {
        router.push('/teacher/classrooms');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [status, router, session]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden text-on-surface">
      {/* Background Atmospheric Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="text-center">
        <div className="inline-block animate-spin-slow mb-md">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        </div>
        <h1 className="font-display text-headline-lg text-on-surface mb-xs animate-fade-in-up">Loading Portal</h1>
        <p className="font-body-md text-on-surface-variant animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          SecureNet Attend
        </p>
      </div>
    </div>
  );
}
