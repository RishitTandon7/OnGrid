'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, LogIn, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please try again.');
        } else {
          setError('An error occurred during sign in. Please try again.');
        }
      } else if (result?.ok) {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(var(--foreground) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 animate-float">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-.995l-4.857 2.43c-.29.145-.63.145-.92 0L9.18 3.825c-.29-.145-.63-.145-.92 0L3.385 6.225A1.125 1.125 0 002.625 7.23v10.185c0 .426.24.815.62 1.006l4.875 2.437c.295.148.64.148.936 0l4.875-2.437z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-50 dark:to-zinc-300 bg-clip-text text-transparent">
            OnGrid
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 font-medium">
            Attendance verification built on precision geofencing
          </p>
        </div>

        {/* Card Wrapper */}
        <div className="card-premium">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-indigo-500" />
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input pl-10"
                  placeholder="name@college.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error animate-fade-in flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-xs">{error}</span>
              </div>
            )}

            {/* Quick Demo Fills */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mb-2 tracking-wider">
                <span>DEMO CREDENTIALS</span>
                <span>CLICK TO FILL</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('teacher@college.edu');
                    setPassword('OnGridTeacherSecure2026!');
                  }}
                  className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:border-indigo-500/30"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Teacher Demo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('alice@college.edu');
                    setPassword('OnGridStudentSecure2026!');
                  }}
                  className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:border-emerald-500/30"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Student Demo
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info box */}
        <div className="mt-6 text-center text-[10px] text-zinc-400 dark:text-zinc-600 leading-normal">
          <p>📧 Teacher: teacher@college.edu / OnGridTeacherSecure2026!</p>
          <p>📧 Students: alice@college.edu, bob@college.edu / OnGridStudentSecure2026!</p>
        </div>
      </div>
    </div>
  );
}
