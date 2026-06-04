'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Activity, 
  MapPin, 
  CalendarCheck,
  Map
} from 'lucide-react';

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
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const [sessionData, setSessionData] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
        <nav className="nav-bar">
          <div className="nav-container">
            <Link href="/" className="nav-brand">OnGrid</Link>
          </div>
        </nav>
        <main className="flex-1 container-page flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-sm card">
            <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-base mb-4">Session record not found</p>
            <Link href="/teacher/dashboard" className="btn btn-primary w-full">
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="nav-brand">
              OnGrid
            </Link>
            <div className="nav-menu">
              <Link href="/teacher/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link href="/" className="nav-link">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 container-page py-12 px-4 relative z-10 animate-fade-in">
        {/* Back Link */}
        <Link href="/teacher/dashboard" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 text-xs font-semibold mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sessions
        </Link>

        {/* Title Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-full text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-3">
            <Map className="w-3.5 h-3.5 text-indigo-500" />
            <span>Classroom Session Details</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            {sessionData.classroom.name}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
            Room Label: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sessionData.classroom.label}</span>
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-white/50 dark:bg-zinc-900/30">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Status</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${sessionData.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className={`text-base font-extrabold ${sessionData.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {sessionData.isActive ? 'Active' : 'Closed'}
              </span>
            </div>
          </div>
          <div className="card bg-white/50 dark:bg-zinc-900/30">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Gate Open Time</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {new Date(sessionData.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="card bg-white/50 dark:bg-zinc-900/30">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Students Marked</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Users className="w-4 h-4 text-violet-500" />
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                {sessionData.records.length}
              </span>
            </div>
          </div>
          <div className="card bg-white/50 dark:bg-zinc-900/30">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Duration</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Activity className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {sessionData.endedAt
                  ? Math.round(
                      (new Date(sessionData.endedAt).getTime() -
                        new Date(sessionData.startedAt).getTime()) /
                        60000
                    ) + ' mins'
                  : 'Ongoing'}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Log Table */}
        <div className="card">
          <div className="pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-500" />
              Attendance Record Register
            </h2>
          </div>
          
          <div className="card-body px-0">
            {sessionData.records.length === 0 ? (
              <div className="text-center py-12 max-w-sm mx-auto text-zinc-400 dark:text-zinc-600">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold">No student has check-in logs</p>
                <p className="text-xs mt-1">When students complete geolocation check-ins, they will populate here instantly.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th className="hidden sm:table-cell">Email</th>
                      <th>Marked At</th>
                      <th>GPS Coordinates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionData.records.map((record) => (
                      <tr key={record.id}>
                        <td className="font-bold text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-center">
                              {getInitials(record.student.name)}
                            </div>
                            <span>{record.student.name}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell text-xs text-zinc-400 font-semibold">{record.student.email}</td>
                        <td className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td>
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-2 py-1 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg">
                            <MapPin className="w-3.5 h-3.5" />
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
