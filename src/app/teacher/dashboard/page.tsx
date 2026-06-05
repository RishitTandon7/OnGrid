'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Session {
  id: string;
  classroom: { name: string; label: string };
  startedAt: string;
  endedAt: string | null;
  windowMinutes: number;
  isActive: boolean;
  records: { id: string }[];
}

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'TEACHER') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (session && session.user?.role === 'TEACHER') {
      fetchSessions();
    }
  }, [session]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setSessions(data);
      } else {
        setError(data.message || 'Failed to load sessions');
        setSessions([]);
      }
    } catch (err) {
      setError('Failed to load sessions');
      console.error('Error fetching sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = async (sessionId: string, isActive: boolean) => {
    try {
      setError('');
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        setSuccess(isActive ? 'Session ended' : 'Session resumed');
        setTimeout(() => setSuccess(''), 3000);
        fetchSessions();
      } else {
        setError('Failed to update session');
      }
    } catch (err) {
      setError('Error updating session');
      console.error('Error updating session:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin-slow" style={{ fontSize: '48px' }}>
          autorenew
        </span>
      </div>
    );
  }

  const activeCount = sessions.filter(s => s.isActive).length;
  const totalStudentsMarked = sessions.reduce((acc, s) => acc + s.records.length, 0);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col md:flex-row relative">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[0%] left-[50%] -translate-x-1/2 w-[80%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between px-md z-50">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <span className="font-display font-semibold text-title-md tracking-tight">SecureNet Attend</span>
        </div>
        <div className="flex items-center gap-md text-sm font-medium">
          <Link href="/teacher/dashboard" className="text-primary border-b-2 border-primary pb-1">Dashboard</Link>
          <Link href="/teacher/classrooms" className="text-on-surface-variant hover:text-primary transition-colors">Classrooms</Link>
        </div>
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-on-surface cursor-pointer">settings</span>
          <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs uppercase cursor-pointer">
            {session?.user?.name?.slice(0, 2) || 'DA'}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-[240px] border-r border-outline-variant bg-surface/50 backdrop-blur-sm p-md flex flex-col z-40 hidden md:flex">
        <div className="flex flex-col gap-xs mb-xl">
          <div className="flex items-center gap-xs text-primary mb-xs">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-title-sm leading-tight">Admin</span>
              <span className="font-display font-semibold text-title-sm leading-tight">Panel</span>
            </div>
          </div>
          <span className="text-label-sm font-mono text-on-surface-variant">SecureNet Verify</span>
        </div>
        
        <nav className="flex flex-col gap-xs flex-1">
          <Link href="/teacher/dashboard" className="sidebar-link-active">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="flex-1">Overview</span>
          </Link>
          <Link href="/teacher/classrooms" className="sidebar-link">
            <span className="material-symbols-outlined">location_on</span>
            <span className="flex-1 flex flex-col leading-tight">
              <span>Geo-</span>
              <span>Fencing</span>
            </span>
          </Link>
          <div className="sidebar-link opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined">history</span>
            <span className="flex-1">Session Logs</span>
          </div>
          <div className="sidebar-link opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined">tune</span>
            <span className="flex-1">Settings</span>
          </div>
        </nav>

        <div className="mt-auto flex flex-col gap-sm pt-md border-t border-outline-variant">
          <Link href="/teacher/sessions/new" className="btn-primary justify-center">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Session
          </Link>
          <Link href="/api/auth/signout" className="sidebar-link mt-xs">
            <span className="material-symbols-outlined">logout</span>
            <span className="flex-1">Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 mt-16 md:ml-[240px] p-md md:p-xl animate-fade-in-up">
        
        <div className="flex items-end justify-between mb-xl">
          <div>
            <h1 className="font-display text-headline-md font-semibold text-on-surface mb-xs">Overview Dashboard</h1>
            <p className="text-body-md text-on-surface-variant max-w-lg">
              Manage your active attendance sessions, review student check-ins, and orchestrate live coordinate verification.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert bg-primary/10 border-primary text-primary mb-md">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="alert bg-error/10 border-error text-error mb-md">
            <span className="material-symbols-outlined">error</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          <div className="card border-outline-variant/50 bg-surface/50 backdrop-blur-sm">
            <div className="flex items-center gap-sm mb-md text-on-surface-variant">
              <span className="material-symbols-outlined">calendar_today</span>
              <span className="text-label-md font-medium uppercase tracking-wider">Total Sessions</span>
            </div>
            <h3 className="font-display text-display-sm font-semibold">{sessions.length}</h3>
          </div>

          <div className="card border-outline-variant/50 bg-surface/50 backdrop-blur-sm relative overflow-hidden group">
            {activeCount > 0 && <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />}
            <div className={`flex items-center gap-sm mb-md ${activeCount > 0 ? 'text-primary' : 'text-on-surface-variant'} relative z-10`}>
              <span className={`material-symbols-outlined ${activeCount > 0 ? 'animate-pulse' : ''}`}>sensors</span>
              <span className="text-label-md font-medium uppercase tracking-wider">Active Sessions</span>
            </div>
            <h3 className="font-display text-display-sm font-semibold relative z-10">{activeCount}</h3>
          </div>

          <div className="card border-outline-variant/50 bg-surface/50 backdrop-blur-sm">
            <div className="flex items-center gap-sm mb-md text-on-surface-variant">
              <span className="material-symbols-outlined">group</span>
              <span className="text-label-md font-medium uppercase tracking-wider">Total Check-ins</span>
            </div>
            <h3 className="font-display text-display-sm font-semibold">{totalStudentsMarked}</h3>
          </div>
        </div>

        {/* Sessions Content */}
        {sessions.length === 0 ? (
          <div className="card border-dashed flex flex-col items-center justify-center text-center py-2xl bg-surface/30">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-md">
              <span className="material-symbols-outlined text-[32px]">calendar_add_on</span>
            </div>
            <h2 className="font-display text-title-lg font-semibold mb-xs">No sessions recorded</h2>
            <p className="text-body-md text-on-surface-variant max-w-md mb-lg">
              Before students can check-in, you must start an active attendance session for an existing classroom.
            </p>
            <Link href="/teacher/sessions/new" className="btn-primary">
              Start First Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {sessions.map((sess) => (
              <div key={sess.id} className={`card flex flex-col justify-between transition-all ${sess.isActive ? 'border-primary shadow-sm bg-primary/5' : 'border-outline-variant/50 bg-surface/50'}`}>
                <div>
                  <div className="flex items-start justify-between mb-md">
                    <div>
                      <h2 className="font-display text-title-md font-semibold text-on-surface leading-tight mb-xs">
                        {sess.classroom.name}
                      </h2>
                      <p className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">
                        Room {sess.classroom.label}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-label-sm font-medium border ${sess.isActive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
                        {sess.isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                        {sess.isActive ? 'LIVE' : 'ENDED'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface border border-outline-variant/50 rounded-lg p-sm mb-md grid grid-cols-2 gap-sm text-body-sm text-on-surface">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                      <span>{new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[16px] text-primary">how_to_reg</span>
                      <span>{sess.records.length} Present</span>
                    </div>
                    <div className="flex items-center gap-xs col-span-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">timelapse</span>
                      <span>Window: <span className="text-on-surface font-medium">{sess.windowMinutes} mins</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-sm">
                  <button
                    onClick={() => toggleSession(sess.id, sess.isActive)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all text-center ${
                      sess.isActive 
                        ? 'bg-error/10 text-error hover:bg-error/20' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {sess.isActive ? 'End Session' : 'Reopen'}
                  </button>
                  <Link
                    href={`/teacher/sessions/${sess.id}`}
                    className="flex-1 btn-secondary justify-center gap-xs"
                  >
                    <span>View</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
