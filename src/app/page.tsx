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
  MapPinCheck,
  ShieldCheck
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-400 font-semibold text-sm animate-pulse">Authenticating session...</p>
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
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-40 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="nav-bar border-b border-white/5">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="nav-brand flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-violet-500" />
            OnGrid
          </Link>
          <div className="flex items-center gap-4 z-10">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {getInitials(userName)}
              </div>
              <div className="text-left leading-none">
                <p className="text-sm font-bold text-white">{userName}</p>
                <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">{role}</span>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="btn btn-secondary border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2 h-10 px-4"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container-page py-16 relative z-10 animate-fade-in flex flex-col justify-center">
        {/* Welcome Section */}
        <div className="mb-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-400 font-bold mb-6 backdrop-blur-md">
            <Clock className="w-4 h-4 text-violet-400" />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight leading-tight mb-4">
            Hi, {userName}!
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl leading-relaxed">
            Choose an option below to manage attendance geofences and verify coordinates.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {isTeacher ? (
            <>
              {/* Teacher - Dashboard Summary */}
              <Link href="/teacher/dashboard" className="group">
                <div className="card-premium h-full p-8 border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] hover:border-violet-500/30">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <LayoutDashboard className="w-7 h-7 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-3">
                      Attendance Sessions
                    </h2>
                    <p className="text-zinc-400 text-base leading-relaxed">
                      Start, close, and manage real-time student location logging coordinates.
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-indigo-400 text-sm font-bold">
                    <span>Manage Sessions</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center transform group-hover:translate-x-2 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Teacher - Classrooms Geofencing */}
              <Link href="/teacher/classrooms" className="group">
                <div className="card-premium h-full p-8 border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] hover:border-violet-500/30">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                      <BookOpen className="w-7 h-7 text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-3">
                      Classrooms Geofencing
                    </h2>
                    <p className="text-zinc-400 text-base leading-relaxed">
                      Define classroom polygonal bounds by mapping precision coordinates.
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-violet-400 text-sm font-bold">
                    <span>Setup Classrooms</span>
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center transform group-hover:translate-x-2 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </>
          ) : (
            <>
              {/* Student - Mark Attendance */}
              <Link href="/student/mark" className="group">
                <div className="card-premium h-full p-8 border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] hover:border-violet-500/30">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                      <MapPinCheck className="w-7 h-7 text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-3">
                      Check-In Attendance
                    </h2>
                    <p className="text-zinc-400 text-base leading-relaxed">
                      Verify your GPS location coordinates and check-in to active sessions.
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-violet-400 text-sm font-bold">
                    <span>Scan & Check-In</span>
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center transform group-hover:translate-x-2 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Student - Records History */}
              <Link href="/student/dashboard" className="group">
                <div className="card-premium h-full p-8 border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] hover:border-emerald-500/30">
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <History className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-3">
                      My Attendance Logs
                    </h2>
                    <p className="text-zinc-400 text-base leading-relaxed">
                      Review complete historical registers of verified check-ins and classes.
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-emerald-400 text-sm font-bold">
                    <span>View Logs</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center transform group-hover:translate-x-2 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
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
