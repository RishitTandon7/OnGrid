'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  LogOut, 
  ArrowRight,
  Clock,
  MapPinCheck
} from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = session.user?.role;
  const userName = session.user?.name || 'User';
  const isTeacher = role === 'TEACHER';
  
  // Get Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[100px] pointer-events-none"></div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(var(--foreground) 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}></div>

      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="nav-brand">
              OnGrid
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-400/15 border border-indigo-500/20 dark:border-indigo-400/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {getInitials(userName)}
                </div>
                <div className="text-left leading-none">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{userName}</p>
                  <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">{role}</span>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="btn btn-secondary btn-sm flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container-page py-12 px-4 relative z-10 animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-full text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-3">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Hi, {userName}!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
            Choose an option below to manage attendance geofences and verify coordinates.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {isTeacher ? (
            <>
              {/* Teacher - Dashboard Summary */}
              <Link href="/teacher/dashboard" className="group">
                <div className="card h-full flex flex-col justify-between hover:scale-[1.01] hover:border-indigo-500/30">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                      Attendance Sessions
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                      Start, close, and manage real-time student location logging coordinates.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                    <span>Manage Sessions</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Teacher - Classrooms Geofencing */}
              <Link href="/teacher/classrooms" className="group">
                <div className="card h-full flex flex-col justify-between hover:scale-[1.01] hover:border-violet-500/30">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 border border-violet-500/20 dark:border-violet-400/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                      Classrooms Geofencing
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                      Define classroom polygonal bounds by mapping precision coordinates.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-violet-600 dark:text-violet-400 text-sm font-bold">
                    <span>Setup Classrooms</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <>
              {/* Student - Mark Attendance */}
              <Link href="/student/mark" className="group">
                <div className="card h-full flex flex-col justify-between hover:scale-[1.01] hover:border-indigo-500/30">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 dark:border-indigo-400/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <MapPinCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                      Check-In Attendance
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                      Verify your GPS location coordinates and check-in to active sessions.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                    <span>Scan & Check-In</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Student - Records History */}
              <Link href="/student/dashboard" className="group">
                <div className="card h-full flex flex-col justify-between hover:scale-[1.01] hover:border-emerald-500/30">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <History className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                      My Attendance Logs
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                      Review complete historical registers of verified check-ins and classes.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    <span>View Logs</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
