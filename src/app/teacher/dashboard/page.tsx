'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  ChevronRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

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
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-400 font-semibold text-sm animate-pulse">Loading sessions...</p>
        </div>
      </div>
    );
  }

  const activeCount = sessions.filter(s => s.isActive).length;
  const totalStudentsMarked = sessions.reduce((acc, s) => acc + s.records.length, 0);

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
            <Link href="/teacher/classrooms" className="nav-link text-zinc-400 hover:text-white font-bold transition-colors">
              Classrooms
            </Link>
            <Link href="/teacher/sessions/new" className="nav-link text-zinc-400 hover:text-white font-bold transition-colors">
              New Session
            </Link>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-xs font-bold text-white">{session?.user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 container-page py-12 relative z-10 animate-fade-in">
        {/* Dashboard Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="heading-display mb-3 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-violet-400" />
              Instructor Dashboard
            </h1>
            <p className="text-zinc-400 text-base max-w-lg">
              Manage your active attendance sessions, review student check-ins, and orchestrate live coordinate verification.
            </p>
          </div>
          <Link href="/teacher/sessions/new" className="btn btn-primary shadow-[0_0_40px_rgba(139,92,246,0.3)] px-8 h-14">
            <Plus className="w-5 h-5 mr-2" />
            Start Session
          </Link>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert bg-emerald-500/10 border-emerald-500/20 text-emerald-300 mb-8 flex items-center gap-3 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}
        {error && (
          <div className="alert bg-rose-500/10 border-rose-500/20 text-rose-300 mb-8 flex items-center gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card-premium py-8 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Sessions</p>
              <h3 className="text-4xl font-display font-extrabold text-white">{sessions.length}</h3>
            </div>
          </div>

          <div className="card-premium py-8 border-white/5 relative overflow-hidden group">
            {activeCount > 0 && (
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
            )}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-[16px] border flex items-center justify-center ${activeCount > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
                <Activity className={`w-6 h-6 ${activeCount > 0 ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Active Sessions</p>
              <h3 className="text-4xl font-display font-extrabold text-white">{activeCount}</h3>
            </div>
          </div>

          <div className="card-premium py-8 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-violet-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Check-ins</p>
              <h3 className="text-4xl font-display font-extrabold text-white">{totalStudentsMarked}</h3>
            </div>
          </div>
        </div>

        {/* Sessions Content */}
        {sessions.length === 0 ? (
          <div className="card-premium py-20 text-center border-dashed border-white/10 bg-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500 border border-white/10">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">No sessions recorded</h2>
            <p className="text-zinc-500 text-base max-w-md mx-auto leading-relaxed mb-8">
              Before students can check-in, you must start an active attendance session for an existing classroom.
            </p>
            <Link href="/teacher/sessions/new" className="btn btn-primary h-14 px-8 text-base shadow-[0_0_30px_rgba(139,92,246,0.3)]">
              Start Your First Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((sess) => (
              <div key={sess.id} className={`card-premium p-6 flex flex-col justify-between transition-all duration-300 ${sess.isActive ? 'border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-white/5'}`}>
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-display font-bold text-white tracking-tight leading-tight mb-1">
                        {sess.classroom.name}
                      </h2>
                      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Room {sess.classroom.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge px-2.5 py-1 flex items-center gap-1.5 ${sess.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-zinc-400 border border-white/10'}`}>
                        {sess.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        {sess.isActive ? 'LIVE' : 'ENDED'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400 bg-black/40 border border-white/5 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="text-white">{new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                      <span className="text-white">{sess.records.length} Present</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium col-span-2 mt-1">
                      <Sliders className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span>Window: <strong className="text-white">{sess.windowMinutes} mins</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => toggleSession(sess.id, sess.isActive)}
                    className={`flex-1 btn h-12 text-sm font-bold border-none transition-all ${
                      sess.isActive 
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 hover:text-rose-300' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300'
                    }`}
                  >
                    {sess.isActive ? 'End Session' : 'Reopen'}
                  </button>
                  <Link
                    href={`/teacher/sessions/${sess.id}`}
                    className="flex-[1.5] btn btn-secondary h-12 text-sm font-bold border-white/10 hover:border-white/20 bg-white/5 flex items-center justify-center gap-2"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
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
