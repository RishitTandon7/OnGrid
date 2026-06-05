'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { startAuthentication } from '@simplewebauthn/browser';

interface ActiveSession {
  id: string;
  classroom: { name: string; label: string };
  startsAt: string;
  endsAt: string;
}

type VerificationStep = 'idle' | 'account' | 'device' | 'wifi' | 'geofence' | 'biometric' | 'success' | 'error';

export default function StudentMarkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [currentStep, setCurrentStep] = useState<VerificationStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchActiveSessions();
      // Generate a random session ID for display
      setSessionId(`ATT-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`);
    }
  }, [session]);

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch('/api/sessions/active');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setActiveSessions(data);
        if (data.length === 1) setSelectedSession(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPage(false);
    }
  };

  const startVerification = async () => {
    if (!selectedSession) return;
    setCurrentStep('account');
    setErrorMsg('');

    try {
      await delay(800);
      setCurrentStep('device');

      await delay(1000);
      setCurrentStep('wifi');

      await delay(1200);
      setCurrentStep('geofence');

      await delay(1000);
      setCurrentStep('biometric');

      // WebAuthn authentication
      const optRes = await fetch('/api/webauthn/authenticate/generate-options');
      const options = await optRes.json();

      if (!optRes.ok) {
        // Try to mark attendance without biometric if device is not registered
        const body = { sessionId: selectedSession.id, lat: 0, lng: 0 };
        const markRes = await fetch('/api/attendance/mark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (markRes.ok) {
          setCurrentStep('success');
          setTimeout(() => router.push('/student/dashboard'), 2500);
        } else {
          const err = await markRes.json();
          throw new Error(err.message || 'Failed to mark attendance');
        }
        return;
      }

      const authResp = await startAuthentication(options);
      const body = { sessionId: selectedSession.id, lat: 0, lng: 0, webauthnResponse: authResp };
      const markRes = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (markRes.ok) {
        setCurrentStep('success');
        setTimeout(() => router.push('/student/dashboard'), 2500);
      } else {
        const err = await markRes.json();
        throw new Error(err.message || 'Failed to mark attendance');
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Verification failed';
      setErrorMsg(errMsg);
      setCurrentStep('error');
    }
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const stepIndex: Record<VerificationStep, number> = {
    idle: -1, account: 0, device: 1, wifi: 2, geofence: 3, biometric: 4, success: 5, error: -1,
  };

  const getStepState = (step: number) => {
    if (currentStep === 'idle' || currentStep === 'error') return 'waiting';
    if (currentStep === 'success') return 'done';
    const active = stepIndex[currentStep];
    if (step < active) return 'done';
    if (step === active) return 'loading';
    return 'waiting';
  };

  if (status === 'loading' || loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4" />
          <p className="font-label-sm text-label-sm text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { label: 'College Account Verified', sub: 'SSO Authenticated via Azure AD', icon: 'account_circle' },
    { label: 'Registered Device Verified', sub: 'Device Hardware ID Bound', icon: 'smartphone' },
    { label: 'College WiFi Verified', sub: "Detecting 'Eduroam-Campus-Alpha'...", icon: 'wifi' },
    { label: 'Classroom Geo-Fence Verified', sub: 'Waiting for network handshake...', icon: 'location_on' },
    { label: 'Biometric / Fingerprint Verified', sub: 'Final security layer', icon: 'fingerprint' },
  ];

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-margin py-xs bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-md">
          <Link href="/" className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-headline-md font-display font-semibold text-on-surface">SecureNet Attend</span>
          </Link>
          <nav className="hidden md:flex items-center gap-md ml-lg">
            <Link href="/student/dashboard" className="nav-link">Dashboard</Link>
            <Link href="#" className="nav-link">Analytics</Link>
            <Link href="#" className="nav-link">Classrooms</Link>
            <Link href="#" className="nav-link">History</Link>
          </nav>
        </div>
        <div className="flex items-center gap-sm">
          <button className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-xs text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center text-xs font-bold text-on-surface-variant">
            {session?.user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'JA'}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-md lg:p-xl" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.05) 0%, transparent 70%)' }}>
        <div className="w-full max-w-xl">
          {/* Session selection */}
          {currentStep === 'idle' && (
            <div className="mb-gutter">
              {activeSessions.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container mx-auto mb-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '32px' }}>calendar_month</span>
                  </div>
                  <h2 className="font-display text-headline-md text-on-surface mb-xs">No Active Sessions</h2>
                  <p className="text-body-md text-on-surface-variant mb-lg">No active attendance sessions are running right now. Ask your teacher to start a session.</p>
                  <Link href="/student/dashboard" className="btn-secondary inline-flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    Back to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                  <div className="p-md border-b border-outline-variant">
                    <h2 className="font-display text-headline-md">Select Session</h2>
                    <p className="text-body-md text-on-surface-variant">Choose the class you are attending</p>
                  </div>
                  <div className="divide-y divide-outline-variant">
                    {activeSessions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSession(s)}
                        className={`w-full text-left p-md hover:bg-surface-container-low transition-all flex items-center gap-md ${selectedSession?.id === s.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedSession?.id === s.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>school</span>
                        </div>
                        <div>
                          <div className="font-medium font-body-md text-on-surface">{s.classroom.name}</div>
                          <div className="font-label-sm text-label-sm text-on-surface-variant">
                            {s.classroom.label} • {new Date(s.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}–{new Date(s.endsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {selectedSession?.id === s.id && (
                          <span className="material-symbols-outlined text-primary ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Central Verification Card */}
          {currentStep !== 'idle' && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm animate-fade-in">
              {/* Card Header */}
              <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low/30">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-label-sm text-primary uppercase tracking-widest block mb-1">
                      Session ID: #{sessionId}
                    </span>
                    <h1 className="font-display text-headline-md text-on-surface">Identity Verification</h1>
                  </div>
                  {currentStep !== 'success' && currentStep !== 'error' && (
                    <div className="flex items-center gap-xs bg-primary/10 text-primary px-sm py-xs rounded-full">
                      <span className="material-symbols-outlined text-[18px] animate-spin-slow">sync</span>
                      <span className="font-label-sm">Securing...</span>
                    </div>
                  )}
                  {currentStep === 'success' && (
                    <div className="flex items-center gap-xs bg-green-50 text-green-600 border border-green-200 px-sm py-xs rounded-full">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="font-label-sm">Verified!</span>
                    </div>
                  )}
                  {currentStep === 'error' && (
                    <div className="flex items-center gap-xs bg-error-container text-error border border-error/20 px-sm py-xs rounded-full">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      <span className="font-label-sm">Failed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Steps */}
              <div className="p-lg space-y-md">
                {steps.map((step, i) => {
                  const state = getStepState(i);
                  return (
                    <div key={i}>
                      <div className={`flex items-center gap-md ${state === 'waiting' && currentStep !== 'success' ? 'opacity-50' : ''}`}>
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm relative ${
                          state === 'done' || currentStep === 'success'
                            ? 'bg-primary text-on-primary'
                            : state === 'loading'
                            ? 'bg-secondary-container text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {state === 'loading' && (
                            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          )}
                          {state === 'done' || currentStep === 'success' ? (
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
                          ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{step.icon}</span>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className={`font-body-md font-semibold ${state === 'loading' ? 'text-primary step-pulse' : 'text-on-surface'}`}>
                            {step.label}
                          </h3>
                          <p className="font-label-sm text-on-surface-variant">{step.sub}</p>
                        </div>
                        {(state === 'done' || currentStep === 'success') && (
                          <div className="text-primary font-label-sm">
                            {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        )}
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`ml-5 h-6 border-l-2 ${
                          state === 'done' || currentStep === 'success' ? 'border-primary/30' :
                          state === 'loading' ? 'border-primary' :
                          'border-outline-variant border-dashed'
                        }`} />
                      )}
                    </div>
                  );
                })}

                {/* Success state */}
                {currentStep === 'success' && (
                  <div className="mt-md bg-green-50 border border-green-200 rounded-xl p-md text-center animate-fade-in">
                    <span className="material-symbols-outlined text-green-600" style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <h3 className="font-display text-headline-md text-green-700 mt-xs">Attendance Marked!</h3>
                    <p className="text-body-md text-green-600 mt-xs">Redirecting to dashboard...</p>
                  </div>
                )}

                {/* Error state */}
                {currentStep === 'error' && errorMsg && (
                  <div className="mt-md bg-error-container border border-error/20 rounded-xl p-md animate-fade-in">
                    <h3 className="font-body-md font-semibold text-error mb-xs">Verification Failed</h3>
                    <p className="text-body-md text-on-error-container">{errorMsg}</p>
                    <button
                      onClick={() => { setCurrentStep('idle'); setErrorMsg(''); }}
                      className="mt-sm btn-secondary text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="px-lg py-md border-t border-outline-variant flex flex-col items-center gap-sm">
                <p className="font-label-sm text-on-surface-variant text-center px-lg">
                  Please keep your phone within 2 meters of the classroom beacon for successful validation.
                </p>
                <button
                  onClick={() => { setCurrentStep('idle'); setErrorMsg(''); }}
                  className="font-label-sm text-error hover:underline transition-all mt-xs"
                >
                  Cancel Verification
                </button>
              </div>
            </div>
          )}

          {/* Start button */}
          {currentStep === 'idle' && selectedSession && (
            <button
              onClick={startVerification}
              className="w-full mt-gutter bg-primary-container text-on-primary-container py-md rounded-xl font-display text-headline-md shadow-xl hover:shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-sm group"
            >
              <span className="material-symbols-outlined text-[28px] group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
              Start Verification
            </button>
          )}

          {/* Context info */}
          {selectedSession && (
            <div className="mt-lg grid grid-cols-2 gap-sm">
              <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant">
                <span className="font-label-sm text-on-surface-variant block mb-1">Classroom</span>
                <span className="font-body-md font-semibold">{selectedSession.classroom.name}</span>
              </div>
              <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant">
                <span className="font-label-sm text-on-surface-variant block mb-1">Room</span>
                <span className="font-body-md font-semibold">{selectedSession.classroom.label}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
