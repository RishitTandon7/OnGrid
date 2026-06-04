'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Award, 
  History, 
  Activity,
  MapPinCheck
} from 'lucide-react';

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchRecords();
    }
  }, [session]);

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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Loading your attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="nav-brand">
              OnGrid
            </Link>
            <div className="nav-menu">
              <Link href="/student/mark" className="nav-link">
                Mark Attendance
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
        <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 text-xs font-semibold mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Hub
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              My Attendance Records
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
              Review and monitor verified GPS geofenced classroom registers.
            </p>
          </div>
          <Link href="/student/mark" className="btn btn-primary flex items-center gap-2 self-start md:self-auto">
            <MapPinCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
        </div>

        {/* Summary Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="card bg-white/50 dark:bg-zinc-900/30 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Check-ins</p>
              <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">{records.length}</h3>
            </div>
          </div>
          <div className="card bg-white/50 dark:bg-zinc-900/30 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Attendance Status</p>
              <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">
                {records.length > 0 ? '✓ In Good Standing' : 'No Records Yet'}
              </h3>
            </div>
          </div>
          <div className="card bg-white/50 dark:bg-zinc-900/30 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Recent verification</p>
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1.5 leading-normal">
                {records.length > 0 ? (
                  <span>Verified: {new Date(records[0].markedAt).toLocaleDateString()}</span>
                ) : (
                  <span>Ready to scan</span>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Records Content */}
        {records.length === 0 ? (
          <div className="card py-16 text-center max-w-xl mx-auto border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-5 text-zinc-400 dark:text-zinc-600">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No check-in logs registered</h2>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
              You haven&apos;t completed any coordinate check-ins. When your teacher starts a session, scan your location to mark presence.
            </p>
            <Link href="/student/mark" className="btn btn-primary mt-6">
              Mark Attendance Now
            </Link>
          </div>
        ) : (
          <div className="card">
            <div className="pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-500" />
                Verified Attendance History
              </h2>
            </div>
            
            <div className="card-body px-0">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Classroom</th>
                      <th>Room #</th>
                      <th>Marked At</th>
                      <th>GPS Coordinates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id}>
                        <td className="font-bold text-zinc-900 dark:text-zinc-100">
                          {record.session.classroom.name}
                        </td>
                        <td className="text-xs text-zinc-500 font-semibold">{record.session.classroom.label}</td>
                        <td className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          {new Date(record.markedAt).toLocaleString()}
                        </td>
                        <td>
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-2 py-1 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg">
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
          </div>
        )}
      </main>
    </div>
  );
}
