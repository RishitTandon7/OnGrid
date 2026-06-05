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
  Map,
  ShieldCheck
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-400 font-semibold text-sm animate-pulse">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-zinc-100">
        <nav className="nav-bar border-b border-white/5">
          <div className="container-page flex items-center justify-between py-4">
            <Link href="/" className="nav-brand flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-violet-500" />
              OnGrid Instructor
            </Link>
          </div>
        </nav>
        <main className="flex-1 container-page flex items-center justify-center py-12 px-4">
          <div className="text-center max-w-sm card-premium bg-white/5 border-white/10 p-8">
            <p className="text-zinc-400 font-semibold text-base mb-6">Session record not found</p>
            <Link href="/teacher/dashboard" className="btn btn-primary w-full h-12">
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
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-40 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <nav className="nav-bar border-b border-white/5">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="nav-brand flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-violet-500" />
            OnGrid Instructor
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/teacher/dashboard" className="nav-link text-zinc-400 hover:text-white font-bold transition-colors">
              Dashboard
            </Link>
            <Link href="/" className="nav-link text-zinc-400 hover:text-white font-bold transition-colors">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 container-page py-12 relative z-10 animate-fade-in">
        {/* Back Link */}
        <Link href="/teacher/dashboard" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-violet-400 text-sm font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </Link>

        {/* Title Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-400 font-bold mb-6">
            <Map className="w-4 h-4 text-violet-400" />
            <span>Classroom Session Details</span>
          </div>
          <h1 className="text-4xl font-display font-extrabold text-white tracking-tight mb-2">
            {sessionData.classroom.name}
          </h1>
          <p className="text-zinc-400 text-base">
            Room Label: <span className="font-bold text-white">{sessionData.classroom.label}</span>
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="card-premium p-6 border-white/5 bg-white/5 flex flex-col justify-between">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Status</p>
            <div className="flex items-center gap-3 mt-4">
              <span className={`w-3 h-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] ${sessionData.isActive ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-rose-500/50'}`}></span>
              <span className={`text-2xl font-display font-extrabold ${sessionData.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {sessionData.isActive ? 'Active' : 'Closed'}
              </span>
            </div>
          </div>

          <div className="card-premium p-6 border-white/5 bg-white/5 flex flex-col justify-between">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Gate Open Time</p>
            <div className="flex items-center gap-3 mt-4">
              <Clock className="w-6 h-6 text-indigo-400" />
              <span className="text-xl font-display font-extrabold text-white">
                {new Date(sessionData.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="card-premium p-6 border-white/5 bg-white/5 flex flex-col justify-between">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Students Marked</p>
            <div className="flex items-center gap-3 mt-4">
              <Users className="w-6 h-6 text-fuchsia-400" />
              <span className="text-3xl font-display font-extrabold text-white">
                {sessionData.records.length}
              </span>
            </div>
          </div>

          <div className="card-premium p-6 border-white/5 bg-white/5 flex flex-col justify-between">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Duration</p>
            <div className="flex items-center gap-3 mt-4">
              <Activity className="w-6 h-6 text-amber-400" />
              <span className="text-xl font-display font-extrabold text-white">
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
        <div className="card-premium border-white/10 bg-white/[0.02]">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
              <CalendarCheck className="w-6 h-6 text-indigo-400" />
              Attendance Record Register
            </h2>
          </div>
          
          <div className="p-0">
            {sessionData.records.length === 0 ? (
              <div className="text-center py-20 max-w-sm mx-auto text-zinc-500">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-600 border border-white/10">
                  <Users className="w-8 h-8" />
                </div>
                <p className="text-xl font-display font-bold text-white mb-2">No student check-ins yet</p>
                <p className="text-sm leading-relaxed">When students complete geolocation check-ins, they will populate here instantly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/5">
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-zinc-500">Student</th>
                      <th className="hidden sm:table-cell py-4 px-6 text-xs font-bold uppercase tracking-wider text-zinc-500">Email</th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-zinc-500">Marked At</th>
                      <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-zinc-500">GPS Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sessionData.records.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm font-bold text-violet-400 flex items-center justify-center">
                              {getInitials(record.student.name)}
                            </div>
                            <span className="font-bold text-white text-sm">{record.student.name}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell py-4 px-6 text-sm text-zinc-400 font-medium">{record.student.email}</td>
                        <td className="py-4 px-6 text-sm font-bold text-zinc-300">
                          {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <MapPin className="w-4 h-4 text-indigo-400" />
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
