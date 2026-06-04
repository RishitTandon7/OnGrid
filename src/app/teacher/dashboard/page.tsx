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
  ArrowLeft,
  ChevronRight
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Loading sessions...</p>
        </div>
      </div>
    );
  }

  const activeCount = sessions.filter(s => s.isActive).length;
  const totalStudentsMarked = sessions.reduce((acc, s) => acc + s.records.length, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="nav-brand">
              OnGrid
            </Link>
            <div className="nav-menu">
              <Link href="/teacher/classrooms" className="nav-link">
                Classrooms
              </Link>
              <Link href="/teacher/sessions/new" className="nav-link">
                New Session
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
        <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 text-xs font-semibold mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Hub
        </Link>

        {/* Dashboard Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Attendance Sessions
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
              Create, review, and toggle live coordinate verification check-ins.
            </p>
          </div>
          <Link href="/teacher/sessions/new" className="btn btn-primary flex items-center gap-2 self-start md:self-auto">
            <Plus className="w-4 h-4" />
            <span>Start New Session</span>
          </Link>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert alert-success mb-6 animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-6 animate-fade-in flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="card bg-white/50 dark:bg-zinc-900/30 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Sessions</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">{sessions.length}</h3>
            </div>
          </div>
          <div className="card bg-white/50 dark:bg-zinc-900/30 flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeCount > 0 ? 'bg-emerald-500/10 text-emerald-500 animate-pulse' : 'bg-zinc-500/10 text-zinc-400'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Active Sessions</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">{activeCount}</h3>
            </div>
          </div>
          <div className="card bg-white/50 dark:bg-zinc-900/30 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Check-ins</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">{totalStudentsMarked}</h3>
            </div>
          </div>
        </div>

        {/* Sessions Content */}
        {sessions.length === 0 ? (
          <div className="card py-16 text-center max-w-xl mx-auto border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-5 text-zinc-400 dark:text-zinc-600">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No sessions recorded</h2>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
              Before students can check-in, you must start an active attendance session for an existing classroom.
            </p>
            <Link href="/teacher/sessions/new" className="btn btn-primary mt-6">
              Start Your First Session
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((sess) => (
              <div key={sess.id} className={`card flex flex-col justify-between ${sess.isActive ? 'border-emerald-500/30 dark:border-emerald-500/20 shadow-[0_4px_25px_rgba(16,185,129,0.02)]' : ''}`}>
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                        {sess.classroom.name}
                      </h2>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold mt-1">Room {sess.classroom.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sess.isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      )}
                      <span className={`badge ${sess.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {sess.isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-zinc-500 dark:text-zinc-400 border-t border-b border-zinc-100 dark:border-zinc-800/80 py-4 my-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span>{new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <span>{sess.records.length} Present</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium col-span-2 mt-1">
                      <Sliders className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <span>Active for {sess.windowMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => toggleSession(sess.id, sess.isActive)}
                    className={`flex-1 btn btn-sm ${
                      sess.isActive ? 'btn-danger bg-gradient-to-r from-red-500 to-rose-500' : 'btn-success'
                    }`}
                  >
                    {sess.isActive ? 'End Session' : 'Reopen'}
                  </button>
                  <Link
                    href={`/teacher/sessions/${sess.id}`}
                    className="flex-1 btn btn-secondary btn-sm flex items-center justify-center gap-1"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
