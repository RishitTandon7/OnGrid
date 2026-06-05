'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Award, 
  History, 
  Activity,
  MapPinCheck,
  Fingerprint,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';

interface AttendanceRecord {
  id: string;
  session: {
    id: string;
    classroom: { name: string; label: string };
  };
  markedAt: string;
  lat: number;
  lng: number;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchRecords();
      fetchBiometricStatus();
    }
  }, [session]);

  const fetchBiometricStatus = async () => {
    try {
      const res = await fetch('/api/webauthn/status');
      const data = await res.json();
      setIsRegistered(data.isRegistered);
    } catch (e) {
      console.error('Error fetching biometric status:', e);
    }
  };

  const registerDevice = async () => {
    setRegistering(true);
    setRegError('');
    try {
      const optRes = await fetch('/api/webauthn/register/generate-options');
      const options = await optRes.json();
      
      if (!optRes.ok) {
        throw new Error(options.message || 'Failed to generate options');
      }

      const attResp = await startRegistration(options);

      const verRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });

      if (verRes.ok) {
        setIsRegistered(true);
      } else {
        const errorData = await verRes.json();
        throw new Error(errorData.message || 'Failed to verify');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setRegError(errorMsg);
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/attendance/records');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setRecords(data);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-400 font-semibold text-sm animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-40 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[128px] pointer-events-none"></div>

      <nav className="nav-bar border-b border-white/5">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="nav-brand flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-violet-500" />
            OnGrid
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/student/mark" className="nav-link text-white hover:text-violet-400 font-bold">
              Mark Attendance
            </Link>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-xs font-bold text-white">{session?.user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 container-page py-12 relative z-10 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="heading-display mb-3">
              Dashboard
            </h1>
            <p className="text-zinc-400 text-base max-w-lg">
              Welcome back, <span className="text-white font-bold">{session?.user?.name}</span>. Monitor your verified geofenced attendance records.
            </p>
          </div>
          <Link href="/student/mark" className="btn btn-primary shadow-[0_0_40px_rgba(139,92,246,0.3)] px-8">
            <MapPinCheck className="w-5 h-5 mr-2" />
            Check In Now
          </Link>
        </div>

        {/* Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card-premium py-8 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-violet-400">
                <History className="w-6 h-6" />
              </div>
              <span className="badge badge-primary">Total Logs</span>
            </div>
            <div>
              <h3 className="text-4xl font-display font-extrabold text-white">{records.length}</h3>
              <p className="text-sm text-zinc-500 mt-2 font-medium">Verified check-ins</p>
            </div>
          </div>

          <div className="card-premium py-8 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <span className="badge badge-success">Status</span>
            </div>
            <div>
              <h3 className="text-xl font-display font-extrabold text-white mt-2">
                {records.length > 0 ? 'Good Standing' : 'No Records'}
              </h3>
              <p className="text-sm text-zinc-500 mt-2 font-medium">Current attendance status</p>
            </div>
          </div>

          <div className="card-premium py-8 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                <Activity className="w-6 h-6" />
              </div>
              <span className="badge badge-warning">Recent</span>
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white mt-3">
                {records.length > 0 ? (
                  new Date(records[0].markedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                ) : (
                  'Ready to scan'
                )}
              </h3>
              <p className="text-sm text-zinc-500 mt-2 font-medium">Last verification</p>
            </div>
          </div>
        </div>

        {/* Biometric Registration Banner */}
        {!isRegistered && !loading && (
          <div className="relative overflow-hidden bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-8 mb-10 backdrop-blur-3xl shadow-[0_32px_64px_rgba(245,158,11,0.1)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[80px] pointer-events-none rounded-full"></div>
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 border border-amber-500/30">
                  <Fingerprint className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-amber-300">Biometric Setup Required</h3>
                  <p className="text-sm text-amber-100/70 mt-1 max-w-2xl leading-relaxed">
                    You must register this device using Fingerprint or Face ID to mark attendance. 
                    <strong className="text-white"> Only one device can be registered per student.</strong>
                  </p>
                  {regError && <p className="text-xs text-rose-400 mt-2 font-bold">{regError}</p>}
                </div>
              </div>
              <button 
                onClick={registerDevice}
                disabled={registering}
                className="btn bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] font-bold px-6 whitespace-nowrap border-none"
              >
                {registering ? 'Waiting for prompt...' : 'Setup Device Lock'}
              </button>
            </div>
          </div>
        )}

        {isRegistered && (
           <div className="alert bg-emerald-500/10 border-emerald-500/20 text-emerald-300 mb-10 flex items-center gap-3 backdrop-blur-md">
             <Smartphone className="w-5 h-5 flex-shrink-0" />
             <span>This device is securely locked to your account for biometric verification.</span>
           </div>
        )}

        {/* Records Content */}
        {records.length === 0 ? (
          <div className="card-premium py-20 text-center border-dashed border-white/10 bg-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500 border border-white/10">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">No verification logs found</h2>
            <p className="text-zinc-500 text-base max-w-md mx-auto leading-relaxed mb-8">
              You haven&apos;t completed any biometric check-ins yet. Wait for your instructor to start a session.
            </p>
            <Link href="/student/mark" className="btn btn-secondary border-white/10 hover:border-white/20">
              Go to Check-in Scanner
            </Link>
          </div>
        ) : (
          <div className="card-premium p-0 overflow-hidden border-white/5 bg-white/5">
            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                <History className="w-5 h-5 text-violet-400" />
                Verified Attendance Logs
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="bg-black/40 border-b border-white/5 text-zinc-400">Classroom</th>
                    <th className="bg-black/40 border-b border-white/5 text-zinc-400">Room #</th>
                    <th className="bg-black/40 border-b border-white/5 text-zinc-400">Marked At</th>
                    <th className="bg-black/40 border-b border-white/5 text-zinc-400">GPS Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                      <td className="px-6 py-5 font-bold text-white bg-transparent border-0">
                        {record.session.classroom.name}
                      </td>
                      <td className="px-6 py-5 text-sm text-zinc-400 font-medium bg-transparent border-0">
                        {record.session.classroom.label}
                      </td>
                      <td className="px-6 py-5 text-sm text-zinc-400 font-medium bg-transparent border-0">
                        {new Date(record.markedAt).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-5 bg-transparent border-0">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 px-2.5 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{record.lat.toFixed(5)}, {record.lng.toFixed(5)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
