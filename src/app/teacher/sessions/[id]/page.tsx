'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Attendee {
  id: string;
  student: { id: string; name: string; email: string };
  markedAt: string;
  lat: number;
  lng: number;
}

interface SessionDetail {
  id: string;
  classroom: { name: string; label: string };
  startedAt: string;
  endedAt: string | null;
  isActive: boolean;
  records: Attendee[];
}

export default function SessionDetailPage() {
  const { data: authSession, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [sessionData, setSessionData] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const fetchSessionDetail = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      setSessionData(data);
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetail();
    }
  }, [fetchSessionDetail, sessionId]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin-slow" style={{ fontSize: '48px' }}>
          autorenew
        </span>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col relative overflow-hidden">
        <nav className="h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-md z-50">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="font-display font-semibold text-title-md tracking-tight">SecureNet Attend</span>
          </div>
        </nav>
        <main className="flex-1 flex items-center justify-center p-md">
          <div className="card text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-sm">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </div>
            <p className="font-display text-title-md font-semibold mb-lg">Session record not found</p>
            <Link href="/teacher/dashboard" className="btn-primary justify-center">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'S';
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[0%] right-[0%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Top Navbar */}
      <nav className="h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-md z-50">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <span className="font-display font-semibold text-title-md tracking-tight">SecureNet Attend</span>
        </div>
        <div className="flex items-center gap-md text-sm font-medium">
          <Link href="/teacher/dashboard" className="text-on-surface-variant hover:text-primary transition-colors">Dashboard</Link>
          <Link href="/teacher/classrooms" className="text-on-surface-variant hover:text-primary transition-colors">Classrooms</Link>
        </div>
        <div className="flex items-center gap-sm">
          <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs uppercase cursor-pointer">
            {authSession?.user?.name?.slice(0, 2) || 'DA'}
          </div>
        </div>
      </nav>

      <main className="flex-1 p-md md:p-xl max-w-[1200px] w-full mx-auto relative z-10 animate-fade-in-up">
        
        <Link href="/teacher/dashboard" className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary text-sm font-medium mb-xl transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Sessions
        </Link>

        {/* Header */}
        <div className="mb-xl">
          <div className="inline-flex items-center gap-xs px-3 py-1 bg-surface-container/50 border border-outline-variant rounded-full text-label-sm font-mono text-on-surface-variant uppercase tracking-wider mb-sm">
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span>Classroom Session Details</span>
          </div>
          <h1 className="font-display text-headline-md font-semibold text-on-surface mb-xs">
            {sessionData.classroom.name}
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Room Label: <span className="font-medium text-on-surface">{sessionData.classroom.label}</span>
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
          <div className="card border-outline-variant/50 bg-surface/50 backdrop-blur-sm flex flex-col justify-between">
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-md">Status</p>
            <div className="flex items-center gap-sm">
              <span className={`w-3 h-3 rounded-full ${sessionData.isActive ? 'bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]' : 'bg-error shadow-[0_0_8px_var(--error)]'}`} />
              <span className={`font-display text-display-sm font-semibold ${sessionData.isActive ? 'text-primary' : 'text-error'}`}>
                {sessionData.isActive ? 'Active' : 'Closed'}
              </span>
            </div>
          </div>

          <div className="card border-outline-variant/50 bg-surface/50 backdrop-blur-sm flex flex-col justify-between">
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-md">Gate Open Time</p>
            <div className="flex items-center gap-sm text-on-surface">
              <span className="material-symbols-outlined text-primary text-[32px]">schedule</span>
              <span className="font-display text-display-sm font-semibold">
                {new Date(sessionData.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="card border-outline-variant/50 bg-surface/50 backdrop-blur-sm flex flex-col justify-between">
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-md">Students Marked</p>
            <div className="flex items-center gap-sm text-on-surface">
              <span className="material-symbols-outlined text-primary text-[32px]">group</span>
              <span className="font-display text-display-sm font-semibold">
                {sessionData.records.length}
              </span>
            </div>
          </div>

          <div className="card border-outline-variant/50 bg-surface/50 backdrop-blur-sm flex flex-col justify-between">
            <p className="text-label-sm font-medium text-on-surface-variant uppercase tracking-wider mb-md">Active Duration</p>
            <div className="flex items-center gap-sm text-on-surface">
              <span className="material-symbols-outlined text-primary text-[32px]">timelapse</span>
              <span className="font-display text-display-sm font-semibold">
                {sessionData.endedAt
                  ? Math.round((new Date(sessionData.endedAt).getTime() - new Date(sessionData.startedAt).getTime()) / 60000) + ' mins'
                  : 'Ongoing'}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden border-outline-variant bg-surface">
          <div className="p-md border-b border-outline-variant bg-surface-container/30">
            <h2 className="font-display text-title-md font-semibold flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">fact_check</span>
              Attendance Record Register
            </h2>
          </div>
          
          <div>
            {sessionData.records.length === 0 ? (
              <div className="text-center py-2xl">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[32px]">group_off</span>
                </div>
                <p className="font-display text-title-lg font-semibold mb-xs">No student check-ins yet</p>
                <p className="text-body-md text-on-surface-variant max-w-md mx-auto">When students complete geolocation check-ins, they will populate here instantly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container/50 border-b border-outline-variant">
                      <th className="py-3 px-md text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Student</th>
                      <th className="hidden sm:table-cell py-3 px-md text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Email</th>
                      <th className="py-3 px-md text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">Marked At</th>
                      <th className="py-3 px-md text-label-sm font-medium text-on-surface-variant uppercase tracking-wider">GPS Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {sessionData.records.map((record) => (
                      <tr key={record.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="py-md px-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container text-sm font-bold flex items-center justify-center">
                              {getInitials(record.student.name)}
                            </div>
                            <span className="font-medium text-on-surface">{record.student.name}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell py-md px-md text-body-md text-on-surface-variant">{record.student.email}</td>
                        <td className="py-md px-md text-body-md font-mono">
                          {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-md px-md">
                          <div className="inline-flex items-center gap-xs px-2 py-1 bg-surface-container/50 border border-outline-variant rounded-md text-label-sm font-mono text-on-surface-variant">
                            <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                            <span>{record.lat.toFixed(6)}, {record.lng.toFixed(6)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
