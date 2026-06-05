'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Classroom {
  id: string;
  name: string;
  label: string;
  lat: number;
  lng: number;
  radius: number;
  wifiSSID?: string;
}

export default function TeacherClassroomsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [radius, setRadius] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'TEACHER') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (session) fetchClassrooms();
  }, [session]);

  const fetchClassrooms = async () => {
    try {
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setClassrooms(data);
        if (data.length > 0) {
          setSelectedClassroom(data[0]);
          setRadius(data[0].radius || 20);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectClassroom = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setRadius(classroom.radius || 20);
    setSaveSuccess(false);
  };

  const saveConfiguration = async () => {
    if (!selectedClassroom) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ radius }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        const updated = classrooms.map((c) =>
          c.id === selectedClassroom.id ? { ...c, radius } : c
        );
        setClassrooms(updated);
        setSelectedClassroom((prev) => prev ? { ...prev, radius } : prev);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-on-surface">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4" />
          <p className="font-label-sm text-label-sm text-on-surface-variant">Loading classrooms...</p>
        </div>
      </div>
    );
  }

  const lat = selectedClassroom?.lat ?? 41.8781;
  const lng = selectedClassroom?.lng ?? -87.6298;
  const mapScale = (radius / 20) * 300;

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary-fixed selection:text-primary min-h-screen">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-margin py-xs bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <Link href="/" className="flex items-center gap-xs mr-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-headline-md font-display font-semibold text-on-surface">SecureNet Attend</span>
          </Link>
          <nav className="hidden md:flex gap-md ml-lg">
            <Link href="/teacher/dashboard" className="nav-link">Dashboard</Link>
            <Link href="/teacher/dashboard" className="nav-link">Analytics</Link>
            <Link href="/teacher/classrooms" className="nav-link-active">Classrooms</Link>
            <Link href="/teacher/dashboard" className="nav-link">History</Link>
          </nav>
        </div>
        <div className="flex items-center gap-sm">
          <div className="relative px-xs py-base rounded-lg hover:bg-surface-container-low transition-all">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </div>
          <div className="px-xs py-base rounded-lg hover:bg-surface-container-low transition-all">
            <span className="material-symbols-outlined text-on-surface-variant">settings</span>
          </div>
          <button className="bg-primary text-on-primary px-sm py-xs rounded-lg font-label-sm text-label-sm hover:opacity-90 active:scale-[0.98] transition-all">
            Mark Attendance
          </button>
          <div className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant">
            {session?.user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'TP'}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col h-full w-64 bg-surface-container-lowest border-r border-outline-variant py-lg px-sm flex-shrink-0 justify-between">
          <div className="space-y-lg">
            <div className="mb-lg px-sm">
              <div className="flex items-center gap-xs mb-base">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                <span className="font-display text-headline-md font-bold text-primary">Admin Panel</span>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">SecureNet Verify</p>
            </div>

            <nav className="space-y-xs flex-1">
              <p className="font-label-sm text-[10px] uppercase tracking-wider text-outline mb-xs px-sm">Management</p>
              <Link href="/teacher/dashboard" className="sidebar-link">
                <span className="material-symbols-outlined">dashboard</span>
                <span className="font-label-sm text-label-sm">Overview</span>
              </Link>
              <Link href="/teacher/dashboard" className="sidebar-link">
                <span className="material-symbols-outlined">sensors</span>
                <span className="font-label-sm text-label-sm">Live Monitor</span>
              </Link>
              <Link href="/teacher/classrooms" className="sidebar-link-active">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span className="font-label-sm text-label-sm">Geo-Fencing</span>
              </Link>
              <Link href="/teacher/sessions/new" className="sidebar-link">
                <span className="material-symbols-outlined">history</span>
                <span className="font-label-sm text-label-sm">Session Logs</span>
              </Link>

              {/* Classrooms Section */}
              <div className="pt-md">
                <p className="font-label-sm text-[10px] uppercase tracking-wider text-outline mb-xs px-sm">Classrooms</p>
                <div className="space-y-base">
                  {classrooms.length === 0 ? (
                    <p className="px-sm text-body-md text-on-surface-variant text-sm">No classrooms yet.</p>
                  ) : (
                    classrooms.map((classroom) => (
                      <button
                        key={classroom.id}
                        onClick={() => selectClassroom(classroom)}
                        className={`w-full flex items-center justify-between px-sm py-xs rounded-lg transition-all group ${
                          selectedClassroom?.id === classroom.id
                            ? 'bg-surface-container border border-outline-variant'
                            : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <span className={`font-body-md ${selectedClassroom?.id === classroom.id ? 'font-medium text-primary' : 'text-on-surface'}`}>
                          {classroom.label}
                        </span>
                        {selectedClassroom?.id === classroom.id ? (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-surface-variant group-hover:bg-outline transition-colors" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </nav>
          </div>

          <div className="space-y-xs border-t border-outline-variant pt-md">
            <button className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-label-sm text-label-sm hover:shadow-md transition-all">
              Export Reports
            </button>
            <Link href="#" className="sidebar-link">
              <span className="material-symbols-outlined">help_outline</span>
              <span className="font-label-sm text-label-sm">Help Center</span>
            </Link>
            <button onClick={() => signOut()} className="sidebar-link w-full text-left text-error hover:bg-error-container">
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-sm text-label-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Map Area */}
        <main className="flex-1 relative bg-surface overflow-hidden">
          {/* Map Simulation — Dark satellite-style */}
          <div className="absolute inset-0 bg-[#0F172A]">
            <div
              className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(#1e293b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
            />
            {/* Geofence visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div
                  className="border-2 border-primary/40 bg-primary/5 rounded-full flex items-center justify-center transition-all duration-500"
                  style={{ width: `${mapScale}px`, height: `${mapScale}px` }}
                >
                  <div
                    className="geo-pulse absolute border-2 border-primary rounded-full"
                    style={{ width: `${mapScale}px`, height: `${mapScale}px` }}
                  />
                  {/* Building Marker */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-primary p-xs rounded-lg shadow-xl" style={{ boxShadow: '0 0 30px rgba(53, 37, 205, 0.4)' }}>
                      <span className="material-symbols-outlined text-white" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>apartment</span>
                    </div>
                    <div className="mt-xs bg-surface-container-lowest px-sm py-base rounded-full border border-outline shadow-md">
                      <span className="font-label-sm text-label-sm text-on-surface whitespace-nowrap">
                        {selectedClassroom?.label || 'UB 604'} · Engineering Wing
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-md left-md flex flex-col gap-xs z-10">
            <div className="bg-surface-container-lowest/90 backdrop-blur border border-outline-variant p-xs rounded-xl shadow-sm flex flex-col gap-xs">
              <button className="p-xs hover:bg-surface-container rounded-lg transition-colors">
                <span className="material-symbols-outlined text-on-surface">add</span>
              </button>
              <div className="h-px bg-outline-variant mx-xs" />
              <button className="p-xs hover:bg-surface-container rounded-lg transition-colors">
                <span className="material-symbols-outlined text-on-surface">remove</span>
              </button>
            </div>
            <div className="bg-surface-container-lowest/90 backdrop-blur border border-outline-variant p-xs rounded-xl shadow-sm">
              <button className="p-xs hover:bg-surface-container rounded-lg transition-colors text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
              </button>
            </div>
          </div>

          {/* Top Action Floating Bar */}
          {selectedClassroom && (
            <div className="absolute top-md left-1/2 -translate-x-1/2 flex items-center gap-sm bg-surface-container-lowest/90 backdrop-blur p-base rounded-2xl border border-outline-variant shadow-lg z-20">
              <div className="flex items-center gap-xs px-sm py-xs border-r border-outline-variant">
                <span className="material-symbols-outlined text-primary">edit_location</span>
                <span className="font-body-md font-medium text-on-surface">Modifying: {selectedClassroom.label} Boundary</span>
              </div>
              <button
                onClick={saveConfiguration}
                disabled={saving}
                className="bg-primary text-on-primary px-md py-xs rounded-xl font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              >
                {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Update Geo-Fence Boundary'}
              </button>
            </div>
          )}
        </main>

        {/* Right Settings Panel */}
        <aside className="hidden xl:flex flex-col w-80 bg-surface-container-lowest border-l border-outline-variant flex-shrink-0">
          {selectedClassroom ? (
            <>
              <div className="p-md border-b border-outline-variant">
                <h2 className="font-headline-md text-headline-md mb-xs">Fence Configuration</h2>
                <p className="font-body-md text-on-surface-variant">Classroom {selectedClassroom.label}</p>
              </div>
              <div className="p-md space-y-lg flex-1 overflow-y-auto">
                {/* Coordinates */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Coordinates</label>
                  <div className="grid grid-cols-2 gap-xs">
                    <div className="bg-surface-container-low p-sm rounded-xl border border-outline-variant">
                      <span className="font-label-sm text-[10px] text-on-surface-variant block mb-base">LATITUDE</span>
                      <span className="font-label-sm text-body-md font-medium">{lat.toFixed(4)}° N</span>
                    </div>
                    <div className="bg-surface-container-low p-sm rounded-xl border border-outline-variant">
                      <span className="font-label-sm text-[10px] text-on-surface-variant block mb-base">LONGITUDE</span>
                      <span className="font-label-sm text-body-md font-medium">{Math.abs(lng).toFixed(4)}° W</span>
                    </div>
                  </div>
                </div>

                {/* Radius Slider */}
                <div className="space-y-sm">
                  <div className="flex justify-between items-center">
                    <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Fence Radius</label>
                    <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed px-xs py-base rounded">{radius}m</span>
                  </div>
                  <input
                    className="w-full h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
                    max="100" min="5" type="range"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] font-label-sm text-outline">
                    <span>5M</span>
                    <span>100M</span>
                  </div>
                </div>

                {/* Security Auth */}
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Security Auth</label>
                  <div className="space-y-base">
                    <div className="flex items-center gap-sm p-sm rounded-xl border border-primary bg-primary/5">
                      <span className="material-symbols-outlined text-primary">wifi</span>
                      <div className="flex-1">
                        <span className="font-label-sm text-[10px] text-primary block">WIFI SSID REQUIRED</span>
                        <span className="font-body-md font-medium text-on-surface">
                          {selectedClassroom.wifiSSID || 'Campus_Main_6GHz'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div className="flex items-center gap-sm p-sm rounded-xl border border-outline-variant hover:border-outline transition-colors cursor-pointer group">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface">bluetooth</span>
                      <div className="flex-1">
                        <span className="font-label-sm text-[10px] text-outline block">BT BEACON (OPTIONAL)</span>
                        <span className="font-body-md text-on-surface-variant">Configure Beacon ID</span>
                      </div>
                      <span className="material-symbols-outlined text-outline">add</span>
                    </div>
                  </div>
                </div>

                {/* Status Card */}
                <div className="p-md rounded-2xl bg-surface-container-high/50 border border-outline-variant">
                  <div className="flex items-center gap-sm mb-sm">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="font-label-sm text-label-sm font-medium text-on-surface">System Operational</span>
                  </div>
                  <div className="flex -space-x-2 mb-sm">
                    {['JA', 'SM', 'RL'].map((initials) => (
                      <div key={initials} className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {initials}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container flex items-center justify-center font-label-sm text-[10px] text-on-surface-variant">
                      +42
                    </div>
                  </div>
                  <p className="font-body-md text-on-surface-variant leading-tight">
                    45 students currently validated within this zone.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-md border-t border-outline-variant">
                <div className="flex items-center justify-between mb-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Auto-Refresh</span>
                  <div className="w-8 h-4 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <p className="font-label-sm text-[10px] text-outline text-center">
                  Last synced: {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </>
          ) : (
            <div className="p-md flex-1 flex items-center justify-center text-center">
              <div>
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '48px' }}>location_off</span>
                <p className="font-body-md text-on-surface-variant mt-sm">Select a classroom to configure its geo-fence.</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant flex justify-around py-xs z-50">
        <Link href="/teacher/dashboard" className="flex flex-col items-center gap-base text-on-secondary-container">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-sm text-[10px]">Overview</span>
        </Link>
        <Link href="/teacher/classrooms" className="flex flex-col items-center gap-base text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          <span className="font-label-sm text-[10px]">Geo-Fence</span>
        </Link>
        <Link href="/teacher/sessions/new" className="flex flex-col items-center gap-base text-on-secondary-container">
          <span className="material-symbols-outlined">history</span>
          <span className="font-label-sm text-[10px]">Logs</span>
        </Link>
        <button onClick={() => signOut()} className="flex flex-col items-center gap-base text-on-secondary-container">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-sm text-[10px]">Settings</span>
        </button>
      </div>
    </div>
  );
}
