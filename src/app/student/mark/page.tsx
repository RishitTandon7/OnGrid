'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Compass,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
  Check,
  Layers,
  Fingerprint,
} from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import {
  collectSensorReading,
  type SensorReading,
} from '@/lib/sensors';

interface Session {
  id: string;
  classroom: {
    name: string;
    label: string;
    floor: number;
    building: string;
    altitudeMeters: number | null;
    pressureHpa: number | null;
    altitudeTolerance: number;
  };
  startedAt: string;
  windowMinutes: number;
  teacher: { name: string };
}

const SCAN_STEPS = [
  'Verifying biometric identity (Passkey/FaceID)',
  'Contacting GPS satellites for geofence',
  'Locking presence timestamp',
];

export default function MarkAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(0);

  // Live sensor readings displayed during scan
  const [liveSensor, setLiveSensor] = useState<SensorReading | null>(null);

  // Timer ref for cleanup
  const abortRef = useRef(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchActiveSessions();
    }
  }, [session]);

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('/api/sessions/active');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setSessions(data);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (sess: Session) => {
    setMarking(sess.id);
    setError('');
    setSuccess('');
    setStep(0);
    setLiveSensor(null);
    abortRef.current = false;

    try {
      // ── 1. WebAuthn Biometric Verification ─────────────────────────────────
      setStep(1);
      console.log(`[Sensor] Step 1: Biometric Verification`);
      
      const optRes = await fetch('/api/webauthn/authenticate/generate-options');
      if (!optRes.ok) {
        const d = await optRes.json();
        throw new Error(d.message || 'Failed to initialize biometric challenge. Register your device first.');
      }
      const options = await optRes.json();

      let webAuthnAssertion;
      try {
        webAuthnAssertion = await startAuthentication(options);
      } catch {
        throw new Error('Biometric verification cancelled or failed.');
      }

      // ── 2. Collect GPS & Sensors ──────────────────────────────────────────
      setStep(2);
      console.log(`[Sensor] Step 2: Collecting GPS`);
      const sensorData = await collectSensorReading((sensorStep, label) => {
        console.log(`[Sensor] Collecting: ${label}`);
      });

      if (abortRef.current) return;

      setLiveSensor(sensorData);
      setStep(3); // locking timestamp

      // ── Send to server ───────────────────────────────────────────────────
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sess.id,
          lat: sensorData.lat,
          lng: sensorData.lng,
          webAuthnAssertion,
          altitude: sensorData.gpsAltitude,
          pressure: sensorData.pressureHpa,
          sensorConfidence: 1.0, // Altitude check removed, so default to 1
          deviceOrientation: sensorData.orientation,
          isStationary: sensorData.isStationary,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Attendance marked successfully! Redirecting to dashboard...');
        setTimeout(() => router.push('/student/dashboard'), 1800);
      } else {
        setError(data.message || 'Failed to mark attendance');
        setMarking(null);
        setStep(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      setMarking(null);
      setStep(0);
      console.error('Error:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-400 font-semibold text-sm animate-pulse">Scanning for active gates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-40 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[128px] pointer-events-none"></div>

      <nav className="nav-bar border-b border-white/5">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="nav-brand flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-violet-500" />
            OnGrid
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/student/dashboard" className="nav-link text-white hover:text-violet-400 font-bold">
              Dashboard
            </Link>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-xs font-bold text-white">{session?.user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 container-page py-12 relative z-10 animate-fade-in">
        {/* Back Link */}
        <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-semibold mb-8 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Dashboard
        </Link>

        {/* Title Header */}
        <div className="mb-12">
          <h1 className="heading-display mb-3">
            Check-In Scanner
          </h1>
          <p className="text-zinc-400 text-base max-w-lg">
            Biometric verification & GPS geofence positioning.
          </p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert bg-emerald-500/10 border-emerald-500/20 text-emerald-300 mb-8 flex items-center gap-3 backdrop-blur-md">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}
        {error && (
          <div className="alert bg-rose-500/10 border-rose-500/20 text-rose-300 mb-8 flex items-center gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Active Session List */}
        {sessions.length === 0 ? (
          <div className="card-premium py-20 text-center border-dashed border-white/10 bg-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500 border border-white/10">
              <Compass className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">No active gates detected</h2>
            <p className="text-zinc-500 text-base max-w-md mx-auto leading-relaxed mb-8">
              Instructors haven&apos;t started any attendance tracking session yet. Keep this page open and refresh when classes begin.
            </p>
            <button
              onClick={fetchActiveSessions}
              className="btn btn-secondary border-white/10 hover:border-white/20"
            >
              Scan Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Session Grid */}
            <div className="lg:col-span-2 space-y-6">
              {sessions.map((sess) => (
                <div key={sess.id} className="card-premium p-8 border-white/10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                        {sess.classroom.name}
                      </h2>
                      <p className="text-zinc-400 text-sm font-semibold mt-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-violet-400" />
                        Room {sess.classroom.label} · {sess.classroom.building}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="badge badge-success bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-2 px-3 py-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-bold tracking-wide">ACTIVE GATE</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-zinc-400 bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 font-medium">
                      <User className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <span>By: <strong className="text-white">{sess.teacher.name}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                      <span>Start: <strong className="text-white">{new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Layers className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>Floor: <strong className="text-white">{sess.classroom.floor}</strong></span>
                    </div>
                  </div>

                  {marking === sess.id ? (
                    /* ── Multi-Sensor Scanning Panel ────────────────────── */
                    <div className="rounded-[24px] border border-violet-500/30 bg-violet-950/20 p-8 shadow-[0_0_40px_rgba(139,92,246,0.15)] animate-fade-in relative overflow-hidden">
                      {/* Background scanning glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-transparent pointer-events-none"></div>

                      <div className="flex items-center gap-6 mb-8 relative z-10">
                        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full animate-radar bg-violet-500/10 border border-violet-500/20"></div>
                          <div className="absolute inset-2 rounded-full animate-radar bg-violet-500/20 [animation-delay:0.8s] border border-violet-500/30"></div>
                          <div className="absolute inset-4 rounded-full animate-radar bg-violet-500/30 [animation-delay:1.6s] border border-violet-500/40"></div>
                          <Fingerprint className="w-8 h-8 text-violet-300 relative z-10 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-lg font-display font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping"></span>
                            Security Scan Active
                          </h4>
                          <p className="text-sm text-violet-300/80 mt-1">
                            Biometric Passkey & GPS location verification
                          </p>
                        </div>
                      </div>

                      {/* Step Checklist */}
                      <div className="space-y-3 relative z-10">
                        {SCAN_STEPS.map((label, i) => {
                          const stepNum = i + 1;
                          const done = step > stepNum;
                          const active = step === stepNum;
                          return (
                            <div
                              key={stepNum}
                              className={`flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${
                                done
                                  ? 'text-emerald-400'
                                  : active
                                  ? 'text-violet-300'
                                  : 'text-zinc-500'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                done
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                  : active
                                  ? 'border-violet-500 bg-violet-500/20'
                                  : 'border-zinc-700 bg-transparent'
                              }`}>
                                {done ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : active ? (
                                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                                ) : (
                                  <span className="text-[10px] text-zinc-500">{stepNum}</span>
                                )}
                              </span>
                              <span>{label}</span>
                              {active && (
                                <span className="text-violet-400 animate-pulse ml-auto text-xs font-bold uppercase tracking-widest">
                                  Scanning...
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Live Sensor Readings (shown after step 2) */}
                      {liveSensor && step >= 2 && (
                        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-violet-500/20 relative z-10 animate-fade-in">
                          {/* GPS Valid */}
                          <div className="rounded-[16px] bg-black/40 border border-emerald-500/20 p-4">
                            <div className="flex items-center gap-1.5 mb-2 text-emerald-400">
                              <MapPin className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">GPS Position</span>
                            </div>
                            <p className="text-lg font-display font-extrabold text-white">
                              Locked
                            </p>
                          </div>

                          {/* Identity */}
                          <div className="rounded-[16px] bg-black/40 border border-emerald-500/20 p-4">
                            <div className="flex items-center gap-1.5 mb-2 text-emerald-400">
                              <Fingerprint className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">Biometric</span>
                            </div>
                            <p className="text-lg font-display font-extrabold text-white">
                              Verified
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => markAttendance(sess)}
                      disabled={marking !== null}
                      className="w-full btn btn-primary h-14 text-base shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                    >
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>Lock 3D Geofence &amp; Check-In</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Compliance Panel */}
            <div className="space-y-6">
              <div className="card-premium p-6 border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-violet-400" />
                  </div>
                  <h3 className="font-display font-bold text-base text-white tracking-tight">Security Compliance</h3>
                </div>
                <ul className="text-sm text-zinc-400 space-y-4 leading-relaxed font-medium">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-violet-500 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span>
                    <span><strong className="text-zinc-200">Biometric Lock:</strong> Only the registered device with Face ID / Fingerprint can check in.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-violet-500 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span>
                    <span><strong className="text-zinc-200">GPS Position:</strong> Must be physically within the classroom&apos;s lat/lng boundary.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-violet-500 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span>
                    <span><strong className="text-zinc-200">Campus Network:</strong> Device IP must match the campus subnet.</span>
                  </li>
                </ul>

                <div className="mt-6 pt-5 border-t border-white/10 text-xs text-zinc-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span>Allow biometric and location access when prompted.</span>
                </div>
              </div>

              <div className="card-premium p-6 border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4 text-white">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <Fingerprint className="w-4 h-4 text-zinc-300" />
                  </div>
                  <h4 className="text-sm font-bold font-display">1-Device Policy</h4>
                </div>
                <div className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Your account is securely bound to this device&apos;s Passkey module. 
                  Login from other devices is blocked to prevent proxy attendance.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
