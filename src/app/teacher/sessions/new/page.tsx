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
  Play 
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Loading classrooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

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

        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Start New Session
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
              Open a dynamic check-in gate for student coordinates logging.
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-6 animate-fade-in flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Card */}
          <div className="card-premium">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-5 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              Configure Gate Options
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="label">Classroom Geofence</label>
                {classrooms.length === 0 ? (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex flex-col gap-2">
                    <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold">
                      No classrooms found. You must define a geofenced classroom before opening a session.
                    </p>
                    <Link href="/teacher/classrooms" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold underline self-start">
                      Create Classroom Geofence →
                    </Link>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600 z-10">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <select
                      value={formData.classroomId}
                      onChange={(e) =>
                        setFormData({ ...formData, classroomId: e.target.value })
                      }
                      className="select pl-10"
                      required
                    >
                      <option value="">Choose a classroom...</option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} (Room {classroom.label})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label">Open Window Duration (Minutes)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                    <Clock className="w-4 h-4" />
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
                    className="input pl-10"
                    required
                  />
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium leading-normal mt-1.5">
                  Specify how many minutes students will have to log their presence coordinates. The session auto-closes afterward.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="submit"
                  disabled={classrooms.length === 0}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Session</span>
                </button>
                <Link href="/teacher/dashboard" className="flex-1 btn btn-secondary text-center">
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
