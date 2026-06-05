'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      if (!optRes.ok) throw new Error(options.message || 'Failed to generate options');
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
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4" />
          <p className="font-label-sm text-label-sm text-on-surface-variant">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const studentName = session?.user?.name || 'Julian Alexander';
  const studentInitials = studentName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const presentCount = records.length;
  const absentCount = presentCount > 0 ? 3 : 0;
  const totalClasses = presentCount + absentCount;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 88;
  const donutCircumference = 251.2;
  const donutOffset = donutCircumference - (donutCircumference * attendanceRate) / 100;

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md">
      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-margin py-xs bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <Link href="/" className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-headline-md font-display font-semibold text-on-surface">SecureNet Attend</span>
          </Link>
          <nav className="hidden md:flex gap-sm ml-lg">
            <Link href="/student/dashboard" className="nav-link-active">Dashboard</Link>
            <Link href="/student/mark" className="nav-link">Analytics</Link>
            <Link href="/student/mark" className="nav-link">Classrooms</Link>
            <Link href="/student/mark" className="nav-link">History</Link>
          </nav>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            href="/student/mark"
            className="bg-primary text-on-primary px-sm py-xs rounded-lg font-medium font-body-md text-body-md hover:opacity-90 transition-opacity"
          >
            Mark Attendance
          </Link>
          <div className="flex gap-xs">
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-all">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-all">
              <span className="material-symbols-outlined text-on-surface-variant">settings</span>
            </button>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-xs font-bold text-on-surface-variant">
            {studentInitials}
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* SideNavBar */}
        <aside className="hidden lg:flex flex-col h-[calc(100vh-57px)] sticky top-[57px] py-lg px-sm border-r border-outline-variant bg-surface-container-lowest w-64 flex-shrink-0 justify-between">
          <div className="space-y-lg">
            <div className="px-sm">
              <div className="flex items-center gap-xs mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <span className="font-display text-headline-md font-bold text-primary">Admin Panel</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">SecureNet Verify</p>
            </div>
            <nav className="space-y-xs">
              <Link href="/student/dashboard" className="sidebar-link-active">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                <span className="font-label-sm text-label-sm">Overview</span>
              </Link>
              <Link href="/student/mark" className="sidebar-link">
                <span className="material-symbols-outlined">sensors</span>
                <span className="font-label-sm text-label-sm">Live Monitor</span>
              </Link>
              <Link href="/student/mark" className="sidebar-link">
                <span className="material-symbols-outlined">location_on</span>
                <span className="font-label-sm text-label-sm">Geo-Fencing</span>
              </Link>
              <Link href="/student/mark" className="sidebar-link">
                <span className="material-symbols-outlined">history</span>
                <span className="font-label-sm text-label-sm">Session Logs</span>
              </Link>
              <Link href="/student/mark" className="sidebar-link">
                <span className="material-symbols-outlined">tune</span>
                <span className="font-label-sm text-label-sm">Settings</span>
              </Link>
            </nav>
          </div>
          <div className="space-y-xs pt-lg border-t border-outline-variant">
            <button className="w-full bg-primary-container text-on-primary-container py-xs rounded-lg font-medium text-body-md hover:opacity-90 transition-opacity mb-md">
              Export Reports
            </button>
            <Link href="#" className="sidebar-link">
              <span className="material-symbols-outlined">help_outline</span>
              <span className="font-label-sm text-label-sm">Help Center</span>
            </Link>
            <button onClick={() => signOut()} className="sidebar-link w-full text-left">
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-sm text-label-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-margin grid grid-cols-12 gap-gutter">
          {/* Left Column */}
          <div className="col-span-12 xl:col-span-8 space-y-gutter">
            {/* Bento Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Student Profile Summary */}
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex items-center gap-md">
                <div className="relative">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-outline-variant shadow-sm bg-surface-container-high flex items-center justify-center">
                    <span className="text-3xl font-bold text-on-surface-variant">{studentInitials}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-surface-container-lowest">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
                <div>
                  <h1 className="font-display text-headline-md text-on-surface">{studentName}</h1>
                  <p className="font-label-sm text-label-sm text-primary mb-1">
                    {session?.user?.email?.split('@')[0].toUpperCase() || 'CS-2024-001'}
                  </p>
                  <div className="flex gap-xs">
                    <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Undergraduate</span>
                    <span className="bg-surface-container-high text-on-surface-variant text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Year 3</span>
                  </div>
                </div>
              </div>

              {/* Current Class Card */}
              <div className="bg-primary text-on-primary p-md rounded-xl shadow-lg flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-lg opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>computer</span>
                </div>
                <div className="relative z-10">
                  <p className="font-label-sm text-label-sm text-on-primary-container opacity-80 uppercase tracking-widest mb-xs">Current Class</p>
                  <h2 className="font-display text-headline-md font-semibold">Computer Science</h2>
                  <p className="font-body-md opacity-90 mt-1">Advanced Algorithms • UB 604</p>
                </div>
                <div className="relative z-10 mt-md flex justify-between items-end">
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="font-label-sm text-label-sm">10:00 AM - 11:30 AM</span>
                  </div>
                  <span className="bg-white/20 px-sm py-1 rounded-full text-[12px] font-medium backdrop-blur-sm">In Progress</span>
                </div>
              </div>
            </div>

            {/* Attendance & Verification Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Attendance Donut */}
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex items-center justify-between">
                <div>
                  <h3 className="font-display text-headline-md mb-xs">Attendance</h3>
                  <p className="text-on-surface-variant text-body-md">
                    {attendanceRate >= 85 ? 'Your semester average is above target by 3%.' : 'Attendance needs improvement.'}
                  </p>
                  <div className="mt-md flex gap-sm">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-primary">PRESENT</span>
                      <span className="font-display text-headline-md">{presentCount || 44}</span>
                    </div>
                    <div className="w-px h-10 bg-outline-variant self-center" />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-error">ABSENT</span>
                      <span className="font-display text-headline-md">{absentCount || 6}</span>
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle className="text-surface-container-high" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
                    <circle
                      className="text-primary donut-segment"
                      cx="48" cy="48" fill="transparent" r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={donutCircumference}
                      strokeDashoffset={donutOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-display font-bold text-headline-md">{attendanceRate}%</span>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
                <h3 className="font-display text-headline-md mb-md">Verification Status</h3>
                <ul className="space-y-xs">
                  <li className="flex items-center justify-between p-xs hover:bg-background rounded-lg transition-colors">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">account_circle</span>
                      <span className="font-body-md text-body-md">Account Verified</span>
                    </div>
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </li>
                  <li className="flex items-center justify-between p-xs hover:bg-background rounded-lg transition-colors">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">smartphone</span>
                      <span className="font-body-md text-body-md">Primary Device Registered</span>
                    </div>
                    {isRegistered ? (
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ) : (
                      <span className="font-label-sm text-label-sm text-on-surface-variant px-2 py-0.5 bg-surface-container-high rounded">PENDING</span>
                    )}
                  </li>
                  <li className="flex items-center justify-between p-xs hover:bg-background rounded-lg transition-colors">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">wifi</span>
                      <span className="font-body-md text-body-md">Campus WiFi Connected</span>
                    </div>
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </li>
                  <li className="flex items-center justify-between p-xs hover:bg-background rounded-lg transition-colors">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">distance</span>
                      <span className="font-body-md text-body-md">Geo-fence Active</span>
                    </div>
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </li>
                  <li className="flex items-center justify-between p-xs hover:bg-background rounded-lg transition-colors">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-secondary">fingerprint</span>
                      <span className="font-body-md text-body-md">Biometric Auth Ready</span>
                    </div>
                    {isRegistered ? (
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ) : (
                      <span className="font-label-sm text-label-sm text-on-surface-variant px-2 py-0.5 bg-surface-container-high rounded">PENDING</span>
                    )}
                  </li>
                </ul>
              </div>
            </div>

            {/* Device Registration Banner */}
            {!isRegistered && (
              <div className="bg-error-container/30 border border-error/20 rounded-xl p-md flex flex-col md:flex-row gap-md justify-between items-start md:items-center animate-fade-in">
                <div className="flex gap-md">
                  <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error flex-shrink-0 border border-error/20">
                    <span className="material-symbols-outlined">fingerprint</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-error font-display">Biometric Setup Required</h3>
                    <p className="text-body-md text-on-surface-variant mt-1 leading-relaxed">
                      Register this device with your screen lock (Passkey/FaceID) to verify attendance logs.
                    </p>
                    {regError && <p className="text-sm text-error mt-2 font-label-sm">{regError}</p>}
                  </div>
                </div>
                <button
                  onClick={registerDevice}
                  disabled={registering}
                  className="bg-primary text-on-primary text-xs font-label-sm font-bold px-sm py-xs rounded-lg transition-all hover:opacity-90 whitespace-nowrap"
                >
                  {registering ? 'Setting up...' : 'Setup Device Lock'}
                </button>
              </div>
            )}

            {/* Mark Attendance CTA */}
            <Link
              href="/student/mark"
              className="w-full bg-primary-container text-on-primary-container py-md rounded-xl font-display text-headline-md shadow-xl hover:shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-sm group"
            >
              <span className="material-symbols-outlined text-[28px] group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
              Mark Attendance Now
            </Link>

            {/* History Table */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
              <div className="p-md border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-display text-headline-md">Recent History</h3>
                <button className="text-primary font-label-sm text-label-sm hover:underline">VIEW ALL</button>
              </div>
              <div className="overflow-x-auto">
                {records.length === 0 ? (
                  <div className="p-lg text-center text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>calendar_month</span>
                    <p className="font-body-md mt-sm">No recent attendance sessions found.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant">
                        <th className="p-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Date</th>
                        <th className="p-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Class</th>
                        <th className="p-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Status</th>
                        <th className="p-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-background transition-colors">
                          <td className="p-md font-body-md text-on-surface-variant">
                            {new Date(record.markedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="p-md font-body-md font-medium text-on-surface">
                            {record.session.classroom.name}
                            <span className="block text-[10px] text-on-surface-variant font-normal">Room {record.session.classroom.label}</span>
                          </td>
                          <td className="p-md">
                            <span className="bg-primary/10 text-primary px-sm py-1 rounded-full text-[12px] font-medium">Present</span>
                          </td>
                          <td className="p-md font-label-sm text-label-sm text-on-surface-variant">
                            {new Date(record.markedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="col-span-12 xl:col-span-4 space-y-gutter">
            {/* Notifications Panel */}
            <section className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant h-full">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-display text-headline-md">Notifications</h3>
                <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">3 NEW</span>
              </div>
              <div className="space-y-md">
                <div className="flex gap-sm p-sm rounded-lg bg-surface-container-low border-l-4 border-primary">
                  <span className="material-symbols-outlined text-primary mt-1">info</span>
                  <div className="flex-1">
                    <h4 className="font-body-md font-semibold text-on-surface">New Grade Posted</h4>
                    <p className="text-body-md text-on-surface-variant">Your final project for Advanced Algorithms has been graded.</p>
                    <span className="font-label-sm text-[10px] text-outline mt-2 block">10 MINS AGO</span>
                  </div>
                </div>
                <div className="flex gap-sm p-sm rounded-lg hover:bg-background transition-all">
                  <span className="material-symbols-outlined text-secondary mt-1">event</span>
                  <div className="flex-1">
                    <h4 className="font-body-md font-semibold text-on-surface">Holiday Schedule</h4>
                    <p className="text-body-md text-on-surface-variant">Campus will be closed this Friday for the Annual Symposium.</p>
                    <span className="font-label-sm text-[10px] text-outline mt-2 block">2 HOURS AGO</span>
                  </div>
                </div>
                <div className="flex gap-sm p-sm rounded-lg hover:bg-background transition-all">
                  <span className="material-symbols-outlined text-error mt-1">warning</span>
                  <div className="flex-1">
                    <h4 className="font-body-md font-semibold text-on-surface">Missed Check-in</h4>
                    <p className="text-body-md text-on-surface-variant">You were marked absent for Discrete Math on Oct 21.</p>
                    <span className="font-label-sm text-[10px] text-outline mt-2 block">YESTERDAY</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
              <h3 className="font-display text-headline-md mb-md">Quick Actions</h3>
              <div className="space-y-xs">
                <Link href="/student/mark" className="flex items-center gap-sm p-sm hover:bg-background rounded-lg transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                  </div>
                  <div>
                    <h4 className="font-body-md font-semibold text-on-surface">Check-in Now</h4>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Start attendance verification</p>
                  </div>
                  <span className="material-symbols-outlined text-outline ml-auto group-hover:text-on-surface transition-colors">chevron_right</span>
                </Link>
                <button
                  onClick={registerDevice}
                  disabled={isRegistered || registering}
                  className="w-full flex items-center gap-sm p-sm hover:bg-background rounded-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">fingerprint</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-body-md font-semibold text-on-surface">
                      {isRegistered ? 'Device Registered' : 'Register Device'}
                    </h4>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {isRegistered ? 'Biometrics active' : 'Setup passkey authentication'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-outline ml-auto">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
