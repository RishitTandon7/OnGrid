'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ShieldAlert, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-80 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_8px_32px_rgba(139,92,246,0.5)] mb-6 animate-float relative">
            <div className="absolute inset-0 rounded-[20px] bg-white/20 blur-md pointer-events-none"></div>
            <ShieldCheck strokeWidth="2" className="w-8 h-8 text-white relative z-10" />
          </div>
          <h1 className="heading-display mb-2">
            OnGrid
          </h1>
          <p className="text-zinc-400 text-sm font-medium tracking-wide">
            Next-generation biometric & geofence attendance
          </p>
        </div>

        {/* Card Wrapper */}
        <div className="card-premium">
          <h2 className="text-2xl font-display font-bold text-white mb-8 tracking-tight text-center">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="label">Email Address</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input pl-12"
                  placeholder="name@college.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label flex justify-between items-center">
                <span>Password</span>
                <Link href="#" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Forgot?</Link>
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input pl-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error animate-fade-in flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-sm">{error}</span>
              </div>
            )}

            {/* Quick Demo Fills */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold mb-3 tracking-widest uppercase">
                <span>Demo Access</span>
                <span>Auto-fill</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('teacher@college.edu');
                    setPassword('OnGridTeacherSecure2026!');
                  }}
                  className="px-4 py-3 bg-white/5 hover:bg-violet-500/10 text-zinc-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:border-violet-500/30"
                >
                  <UserCheck className="w-4 h-4 text-violet-400" />
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('alice@college.edu');
                    setPassword('OnGridStudentSecure2026!');
                  }}
                  className="px-4 py-3 bg-white/5 hover:bg-emerald-500/10 text-zinc-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:border-emerald-500/30"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Student
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-4 h-14 text-base"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-zinc-400 text-sm font-medium">
              New to OnGrid?{' '}
              <Link href="/auth/register" className="text-violet-400 font-bold hover:text-violet-300 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info box */}
        <div className="mt-8 text-center text-[11px] text-zinc-600 font-medium tracking-wide">
          <p className="mb-1">Secure Enterprise Access Environment</p>
          <p>© 2026 OnGrid Systems Inc.</p>
        </div>
      </div>
    </div>
  );
}
