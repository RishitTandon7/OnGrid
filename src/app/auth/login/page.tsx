'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen bg-background font-body-md text-on-background flex items-center justify-center p-sm relative overflow-hidden">
      {/* Background Atmospheric Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      {/* Login Container */}
      <main className="w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-xl p-lg md:p-xl micro-shadow animate-fade-in-up">
        {/* Brand Header */}
        <header className="flex flex-col items-center text-center mb-lg">
          <div className="mb-md">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center animate-float">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            </div>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Welcome Back</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Sign in to your secure attendance portal</p>
        </header>

        {/* Login Form */}
        <form className="space-y-md" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="email">
              College Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-sm py-[10px] bg-transparent border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-outline focus:border-primary input-focus-ring transition-all duration-200"
              placeholder="name@college.edu"
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-xs">
            <div className="flex justify-between items-center">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <Link href="#" className="font-label-sm text-label-sm text-primary hover:underline transition-all">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-sm py-[10px] bg-transparent border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-outline focus:border-primary input-focus-ring transition-all duration-200"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-xs px-sm py-xs bg-error-container border border-error/20 rounded-lg animate-fade-in">
              <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>error</span>
              <span className="font-body-md text-on-error-container text-sm flex-1">{error}</span>
            </div>
          )}

          {/* Demo Fills */}
          <div className="pt-xs border-t border-outline-variant">
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider text-center mb-sm">Demo Access</p>
            <div className="grid grid-cols-2 gap-xs">
              <button
                type="button"
                onClick={() => { setEmail('teacher@college.edu'); setPassword('OnGridTeacherSecure2026!'); }}
                className="px-sm py-xs bg-surface-container-low hover:bg-primary/10 text-on-surface-variant hover:text-primary border border-outline-variant rounded-lg text-xs font-label-sm flex items-center justify-center gap-xs transition-all duration-200 hover:border-primary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>school</span>
                Teacher
              </button>
              <button
                type="button"
                onClick={() => { setEmail('alice@college.edu'); setPassword('OnGridStudentSecure2026!'); }}
                className="px-sm py-xs bg-surface-container-low hover:bg-primary/10 text-on-surface-variant hover:text-primary border border-outline-variant rounded-lg text-xs font-label-sm flex items-center justify-center gap-xs transition-all duration-200 hover:border-primary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                Student
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-xs">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] bg-primary-container text-on-primary font-body-md font-medium rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Secondary Actions */}
        <nav className="mt-md pt-md border-t border-outline-variant flex flex-col items-center gap-sm">
          <Link href="#" className="flex items-center gap-xs font-body-md text-on-surface-variant hover:text-primary transition-colors group">
            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors" style={{ fontSize: '18px' }}>phonelink_setup</span>
            <span>Register new device</span>
          </Link>
        </nav>

        {/* Footer */}
        <footer className="mt-xl flex flex-col items-center gap-sm">
          <div className="flex items-center gap-xs px-sm py-xs bg-surface-container-low rounded-full">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Protected by SecureNet Biometric Verification</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
