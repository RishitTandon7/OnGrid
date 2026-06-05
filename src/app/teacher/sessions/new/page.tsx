'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'TEACHER') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (session && session.user?.role === 'TEACHER') {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin-slow" style={{ fontSize: '48px' }}>
          autorenew
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px]" />
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
            {session?.user?.name?.slice(0, 2) || 'DA'}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center p-xl relative z-10 animate-fade-in-up">
        <div className="w-full max-w-[480px]">
          
          <Link href="/teacher/dashboard" className="inline-flex items-center gap-xs text-on-surface-variant hover:text-primary text-sm font-medium mb-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </Link>

          <div className="mb-xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-md shadow-sm border border-primary/20">
              <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
            </div>
            <h1 className="font-display text-headline-sm font-semibold mb-xs">Start New Session</h1>
            <p className="text-body-md text-on-surface-variant">
              Open a dynamic check-in gate for student coordinate logging.
            </p>
          </div>

          {error && (
            <div className="alert bg-error/10 border-error text-error text-sm py-3 px-4 mb-lg">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}

          <div className="card border-outline-variant/50 bg-surface/80 backdrop-blur-md p-xl">
            <h2 className="font-display text-title-md font-semibold text-on-surface mb-lg flex items-center gap-xs pb-sm border-b border-outline-variant">
              <span className="material-symbols-outlined text-primary">tune</span>
              Configure Gate Options
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">Classroom Geofence</label>
                {classrooms.length === 0 ? (
                  <div className="p-md bg-error/5 border border-error/20 rounded-lg flex flex-col gap-xs">
                    <p className="text-body-sm text-error font-medium">
                      No classrooms found. You must define a geofenced classroom before opening a session.
                    </p>
                    <Link href="/teacher/classrooms" className="text-body-sm text-primary font-semibold hover:underline">
                      Create Classroom Geofence →
                    </Link>
                  </div>
                ) : (
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant z-10 group-focus-within:text-primary">
                      <span className="material-symbols-outlined">domain</span>
                    </span>
                    <select
                      value={formData.classroomId}
                      onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                      className="input pl-10 h-12 bg-surface-container/50 focus:bg-surface appearance-none"
                      required
                    >
                      <option value="">Choose a classroom...</option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} (Room {classroom.label})
                        </option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-on-surface-variant z-10">
                      <span className="material-symbols-outlined">expand_more</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">Open Window Duration (Mins)</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant z-10 group-focus-within:text-primary">
                    <span className="material-symbols-outlined">schedule</span>
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.windowMinutes}
                    onChange={(e) => setFormData({ ...formData, windowMinutes: parseInt(e.target.value) || 15 })}
                    className="input pl-10 h-12 bg-surface-container/50 focus:bg-surface"
                    required
                  />
                </div>
                <p className="text-body-sm text-on-surface-variant mt-xs">
                  Specify how many minutes students will have to log their presence. The session auto-closes afterward.
                </p>
              </div>

              <div className="flex gap-sm pt-md border-t border-outline-variant mt-xs">
                <button
                  type="submit"
                  disabled={classrooms.length === 0}
                  className="flex-[2] btn-primary h-12 justify-center gap-xs font-medium"
                >
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  Start Session
                </button>
                <Link href="/teacher/dashboard" className="flex-1 btn-secondary justify-center h-12">
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
