'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center p-md bg-background text-on-surface font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-[420px] bg-surface border border-outline-variant rounded-3xl p-xl shadow-lg relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-xl">
          <div className="w-[60px] h-[60px] rounded-2xl bg-surface border border-outline-variant flex items-center justify-center shadow-sm mb-lg">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          </div>
          <h1 className="font-display text-headline-sm font-semibold mb-xs">Create Account</h1>
          <p className="text-body-md text-on-surface-variant">Register for SecureNet Attend</p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
          
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              name="name"
              placeholder="John Doe" 
              value={formData.name}
              onChange={handleChange}
              required
              className="input bg-surface-container/50 border-outline-variant h-12" 
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">College Email</label>
            <input 
              type="email" 
              name="email"
              placeholder="name@college.edu" 
              value={formData.email}
              onChange={handleChange}
              required
              className="input bg-surface-container/50 border-outline-variant h-12" 
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">Account Type</label>
            <div className="flex gap-sm">
              <label className={`flex-1 flex items-center justify-center gap-xs h-10 rounded-lg border cursor-pointer transition-colors ${formData.role === 'TEACHER' ? 'bg-secondary-container text-on-secondary-container border-secondary-fixed font-medium' : 'bg-surface-container/50 text-on-surface-variant border-outline-variant'}`}>
                <input type="radio" name="role" value="TEACHER" checked={formData.role === 'TEACHER'} onChange={handleChange} className="hidden" />
                <span className="material-symbols-outlined text-[18px]">school</span>
                <span className="text-sm">Teacher</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-xs h-10 rounded-lg border cursor-pointer transition-colors ${formData.role === 'STUDENT' ? 'bg-secondary-container text-on-secondary-container border-secondary-fixed font-medium' : 'bg-surface-container/50 text-on-surface-variant border-outline-variant'}`}>
                <input type="radio" name="role" value="STUDENT" checked={formData.role === 'STUDENT'} onChange={handleChange} className="hidden" />
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span className="text-sm">Student</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
                className="input bg-surface-container/50 border-outline-variant h-12" 
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="text-label-sm font-mono text-on-surface-variant uppercase tracking-wider">Confirm</label>
              <input 
                type="password" 
                name="confirmPassword"
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="input bg-surface-container/50 border-outline-variant h-12" 
              />
            </div>
          </div>

          {error && (
            <div className="alert bg-error/10 border-error text-error text-sm py-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full h-12 justify-center text-body-lg font-medium mt-sm"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <span className="material-symbols-outlined ml-xs">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-xl pt-lg border-t border-outline-variant flex flex-col items-center gap-xs text-center">
          <Link href="/auth/login" className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span className="font-medium text-sm">Already have an account? Sign in</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
