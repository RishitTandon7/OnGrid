'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, ShieldAlert, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Registration failed');
        return;
      }

      router.push('/auth/login');
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-80 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up py-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_8px_32px_rgba(139,92,246,0.5)] mb-6 animate-float relative">
            <div className="absolute inset-0 rounded-[20px] bg-white/20 blur-md pointer-events-none"></div>
            <ShieldCheck strokeWidth="2" className="w-8 h-8 text-white relative z-10" />
          </div>
          <h1 className="heading-display mb-2 text-center text-4xl">
            Join OnGrid
          </h1>
          <p className="text-zinc-400 text-sm font-medium tracking-wide text-center">
            Create an account to verify real-time classroom attendance
          </p>
        </div>

        {/* Card Wrapper */}
        <div className="card-premium">
          <h2 className="text-2xl font-display font-bold text-white mb-8 tracking-tight text-center">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="label">Full Name</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input pl-12"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Email Address</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-12"
                  placeholder="yourname@college.edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Account Type</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors z-10">
                  <UserCheck className="w-5 h-5" />
                </span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="select pl-12 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="STUDENT" className="text-zinc-900">Student</option>
                  <option value="TEACHER" className="text-zinc-900">Instructor / Teacher</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Password</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input pl-11"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Confirm</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="input pl-11"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-error animate-fade-in flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-4 h-14 text-base"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Sign In link */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-zinc-400 text-sm font-medium">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-violet-400 font-bold hover:text-violet-300 transition-colors">
                Sign in
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
