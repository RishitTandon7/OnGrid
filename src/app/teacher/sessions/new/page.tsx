'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Settings, 
  Clock, 
  AlertCircle, 
  Building2, 
  Play,
  ShieldCheck
} from 'lucide-react';

interface Classroom {
  id: string;
  name: string;
  label: string;
}

export default function NewSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    classroomId: '',
    windowMinutes: 15,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchClassrooms();
    }
  }, [session]);

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/classrooms');
      const data = await response.json();
      setClassrooms(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, classroomId: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.classroomId) {
      setError('Please select a classroom');
      return;
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/teacher/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to start session');
      }
    } catch (err) {
      setError('An error occurred while starting the session');
      console.error('Error starting session:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-400 font-semibold text-sm animate-pulse">Loading classrooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-40 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none"></div>

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
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-xs font-bold text-white">{session?.user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 container-page py-12 relative z-10 animate-fade-in flex items-center justify-center">
        <div className="w-full max-w-lg">
          {/* Back Link */}
          <Link href="/teacher/dashboard" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-violet-400 text-sm font-bold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-violet-400 ml-1" />
            </div>
            <h1 className="text-4xl font-display font-extrabold text-white tracking-tight mb-3">
              Start New Session
            </h1>
            <p className="text-zinc-400 text-base max-w-sm mx-auto">
              Open a dynamic check-in gate for student coordinate logging.
            </p>
          </div>

          {error && (
            <div className="alert bg-rose-500/10 border-rose-500/20 text-rose-300 mb-8 flex items-center gap-3 backdrop-blur-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* Form Card */}
          <div className="card-premium border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3 pb-6 border-b border-white/10">
              <Settings className="w-5 h-5 text-indigo-400" />
              Configure Gate Options
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="label text-zinc-300">Classroom Geofence</label>
                {classrooms.length === 0 ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-3">
                    <p className="text-sm text-amber-400 font-semibold">
                      No classrooms found. You must define a geofenced classroom before opening a session.
                    </p>
                    <Link href="/teacher/classrooms" className="text-sm text-amber-300 font-bold underline hover:text-amber-200 transition-colors self-start">
                      Create Classroom Geofence →
                    </Link>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 z-10">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <select
                      value={formData.classroomId}
                      onChange={(e) =>
                        setFormData({ ...formData, classroomId: e.target.value })
                      }
                      className="select pl-12 bg-black/40 border-white/10 text-white focus:border-violet-500 focus:ring-violet-500/20 h-14"
                      required
                    >
                      <option value="" className="bg-zinc-900">Choose a classroom...</option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id} className="bg-zinc-900">
                          {classroom.name} (Room {classroom.label})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label text-zinc-300">Open Window Duration (Minutes)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <Clock className="w-5 h-5" />
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.windowMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        windowMinutes: parseInt(e.target.value) || 15,
                      })
                    }
                    className="input pl-12 bg-black/40 border-white/10 text-white focus:border-violet-500 focus:ring-violet-500/20 h-14"
                    required
                  />
                </div>
                <p className="text-sm text-zinc-500 font-medium leading-normal mt-3">
                  Specify how many minutes students will have to log their presence. The session auto-closes afterward.
                </p>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={classrooms.length === 0}
                  className="flex-[2] btn btn-primary h-14 text-base shadow-[0_0_30px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Session</span>
                </button>
                <Link href="/teacher/dashboard" className="flex-1 btn btn-secondary border-white/10 bg-white/5 h-14 text-base flex items-center justify-center">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
