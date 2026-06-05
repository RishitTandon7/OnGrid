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
  Locate,
  Compass,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
  Check,
  Gauge,
  MoveVertical,
  Activity,
  Navigation,
  Layers,
  Wifi,
  Smartphone,
  Fingerprint,
} from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import {
  collectSensorReading,
  computeFloorConfidence,
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
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null);

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
    setLiveConfidence(null);
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
      } catch (authErr: any) {
        throw new Error('Biometric verification cancelled or failed.');
      }

      // ── 2. Collect GPS & Sensors ──────────────────────────────────────────
      setStep(2);
      console.log(`[Sensor] Step 2: Collecting GPS`);
      const sensorData = await collectSensorReading((sensorStep, label) => {
        // Just log, we simplified steps
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Scanning for active gates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Accent gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[25%] h-[25%] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="nav-brand">
              OnGrid
            </Link>
            <div className="nav-menu">
              <Link href="/student/dashboard" className="nav-link">
                Dashboard
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

        {/* Title Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Check-In Attendance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
            Biometric verification & GPS geofence positioning.
          </p>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert alert-success mb-6 animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-6 animate-fade-in flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Session List */}
        {sessions.length === 0 ? (
          <div className="card py-16 text-center max-w-xl mx-auto border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-5 text-zinc-400 dark:text-zinc-600">
              <Compass className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No active gates detected</h2>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
              Instructors haven&apos;t started any attendance tracking session yet. Keep this page open and refresh when classes begin.
            </p>
            <button
              onClick={fetchActiveSessions}
              className="btn btn-secondary mt-6"
            >
              Scan Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Session Grid */}
            <div className="lg:col-span-2 space-y-6">
              {sessions.map((sess) => (
                <div key={sess.id} className="card relative overflow-hidden bg-white/50 dark:bg-zinc-900/40">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                        {sess.classroom.name}
                      </h2>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold mt-1">
                        Room {sess.classroom.label} · {sess.classroom.building}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="badge badge-success flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Active Gate</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-zinc-500 dark:text-zinc-400 border-t border-b border-zinc-100 dark:border-zinc-800/80 py-4 my-4">
                    <div className="flex items-center gap-2 font-medium">
                      <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span>Instructor: <strong className="text-zinc-700 dark:text-zinc-300">{sess.teacher.name}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-violet-500 flex-shrink-0" />
                      <span>Started: <strong className="text-zinc-700 dark:text-zinc-300">{new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Layers className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>Floor <strong className="text-zinc-700 dark:text-zinc-300">{sess.classroom.floor}</strong></span>
                    </div>
                  </div>

                  {marking === sess.id ? (
                    /* ── Multi-Sensor Scanning Panel ────────────────────── */
                    <div className="rounded-2xl border border-indigo-200/50 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/10 p-5 animate-fade-in space-y-5">
                      {/* Radar Pulse Beacon */}
                      <div className="flex items-center gap-5">
                        <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full animate-radar bg-indigo-500/10"></div>
                          <div className="absolute inset-2 rounded-full animate-radar bg-indigo-500/15 [animation-delay:0.8s]"></div>
                          <div className="absolute inset-4 rounded-full animate-radar bg-indigo-500/20 [animation-delay:1.6s]"></div>
                          <Fingerprint className="w-6 h-6 text-indigo-500 animate-pulse relative z-10" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                            Security Scan In Progress
                          </h4>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            Biometric Passkey & GPS location verification
                          </p>
                        </div>
                      </div>

                      {/* Step Checklist */}
                      <div className="space-y-1.5">
                        {SCAN_STEPS.map((label, i) => {
                          const stepNum = i + 1;
                          const done = step > stepNum;
                          const active = step === stepNum;
                          return (
                            <div
                              key={stepNum}
                              className={`flex items-center gap-2 text-xs font-semibold transition-all duration-300 ${
                                done
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : active
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-zinc-400 dark:text-zinc-600'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                                done
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : active
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : 'border-zinc-200 dark:border-zinc-700'
                              }`}>
                                {done ? (
                                  <Check className="w-2.5 h-2.5" />
                                ) : active ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                ) : (
                                  <span className="text-[8px] text-zinc-400">{stepNum}</span>
                                )}
                              </span>
                              <span>{label}</span>
                              {active && (
                                <span className="text-indigo-500 animate-pulse ml-auto text-[10px] font-bold">
                                  scanning...
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Live Sensor Readings (shown after step 2) */}
                      {liveSensor && step >= 2 && (
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-indigo-100 dark:border-indigo-900/30 animate-fade-in">
                          {/* GPS Valid */}
                          <div className="rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-indigo-100 dark:border-indigo-900/30 p-2.5">
                            <div className="flex items-center gap-1 mb-1 text-emerald-500">
                              <MapPin className="w-3 h-3" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">GPS</span>
                            </div>
                            <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                              Locked
                            </p>
                          </div>

                          {/* Identity */}
                          <div className="rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-indigo-100 dark:border-indigo-900/30 p-2.5">
                            <div className="flex items-center gap-1 mb-1 text-violet-500">
                              <Fingerprint className="w-3 h-3" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Identity</span>
                            </div>
                            <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
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
                      className="w-full btn btn-primary flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Lock 3D Geofence &amp; Check-In</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Compliance Panel */}
            <div className="space-y-4">
              <div className="card bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-200/50 dark:border-indigo-900/30">
                <div className="flex items-center gap-2.5 mb-4 text-indigo-950 dark:text-indigo-200">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-extrabold text-sm tracking-tight">Identity & Geofence Compliance</h3>
                </div>
                <ul className="text-xs text-indigo-800/80 dark:text-indigo-400/80 space-y-3 leading-relaxed font-semibold">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Biometric Lock:</strong> Only the student's registered device with Face ID / Fingerprint can check in.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>GPS Position:</strong> Must be physically within the classroom's lat/lng boundary.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span><strong>Campus Network:</strong> Device IP must match the teacher's campus building subnet.</span>
                  </li>
                </ul>

                <div className="mt-6 pt-5 border-t border-indigo-100 dark:border-indigo-900/40 text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span>Allow biometric and location access when prompted.</span>
                </div>
              </div>

              {/* Device Notice */}
              <div className="card bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-2 mb-3 text-zinc-700 dark:text-zinc-300">
                  <Fingerprint className="w-4 h-4 text-zinc-500" />
                  <h4 className="text-xs font-bold">1-Device Policy Enforced</h4>
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Your account is securely bound to this device's Passkey/Biometric module. 
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
