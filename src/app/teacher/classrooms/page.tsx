'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Layers,
  Map,
  Plus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Hash,
  Radio,
  Gauge,
  Navigation,
  Wifi,
  ShieldCheck,
  RotateCcw,
  MoveVertical,
  MapPin
} from 'lucide-react';
import GeofencePreview from '@/components/GeofencePreview';

interface Classroom {
  id: string;
  name: string;
  label: string;
  building: string;
  floor: number;
  polygon: { lat: number; lng: number }[];
  altitudeMeters: number | null;
  pressureHpa: number | null;
  altitudeTolerance: number;
}

interface AltitudeCapture {
  pressureHpa: number | null;
  altitudeMeters: number | null;
  accuracy: number | null;
  pressureMethod: string;
  capturedAt: string | null;
}

const parsePolygon = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [lat, lng] = line.split(',').map((part) => Number(part.trim()));
      return { lat, lng };
    });

const emptyForm = {
  name: '',
  label: '',
  building: '',
  floor: 0,
  polygon: [] as { lat: number; lng: number }[],
};

const emptyAltitude: AltitudeCapture = {
  pressureHpa: null,
  altitudeMeters: null,
  accuracy: null,
  pressureMethod: 'none',
  capturedAt: null,
};

export default function ClassroomsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [polygonText, setPolygonText] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [altitudeTolerance, setAltitudeTolerance] = useState(4.0);
  const [isCapturingGps, setIsCapturingGps] = useState(false);

  // Altitude calibration state
  const [altCapture, setAltCapture] = useState<AltitudeCapture>(emptyAltitude);
  const [capturing, setCapturing] = useState(false);
  const [captureStep, setCaptureStep] = useState(0);
  const sensorStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchClassrooms();
    }
  }, [session]);

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/classrooms');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setClassrooms(data);
      } else {
        setError(data.message || 'Failed to load classrooms');
        setClassrooms([]);
      }
    } catch (err) {
      setError('Failed to load classrooms');
      console.error('Error fetching classrooms:', err);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Capture a single GPS point and append it to the polygon text
   */
  const captureGpsPoint = () => {
    setIsCapturingGps(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPoint = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setPolygonText((prev) => (prev.trim() ? `${prev}\n${newPoint}` : newPoint));
        setIsCapturingGps(false);
      },
      (err) => {
        console.error('Error capturing GPS:', err);
        setError('Failed to get location. Please allow location permissions.');
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /**
   * Capture classroom altitude using all available sensors.
   * Teacher must physically be inside the room when clicking this.
   */
  const captureAltitude = async () => {
    setCapturing(true);
    setCaptureStep(0);
    setAltCapture(emptyAltitude);

    let capturedPressure: number | null = null;
    let capturedGpsAlt: number | null = null;
    let capturedAccuracy: number | null = null;
    let pressureMethod = 'none';

    // Step 1: Try barometric pressure sensor
    setCaptureStep(1);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.AbsolutePressureSensor) {
        await new Promise<void>((resolve) => {
          const sensor = new win.AbsolutePressureSensor({ frequency: 5 });
          const timeout = setTimeout(() => { sensor.stop(); resolve(); }, 3000);
          sensor.addEventListener('reading', () => {
            clearTimeout(timeout);
            capturedPressure = sensor.pressure ?? null;
            pressureMethod = 'AbsolutePressureSensor';
            sensor.stop();
            resolve();
          });
          sensor.addEventListener('error', () => { clearTimeout(timeout); resolve(); });
          sensor.start();
        });
      }
    } catch {
      // Sensor not available — continue
    }

    // Step 2: GPS altitude
    setCaptureStep(2);
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          capturedGpsAlt = pos.coords.altitude;
          capturedAccuracy = pos.coords.accuracy;
          resolve();
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    // Step 3: Finalize
    setCaptureStep(3);
    await new Promise((r) => setTimeout(r, 400));

    setAltCapture({
      pressureHpa: capturedPressure,
      altitudeMeters: capturedGpsAlt,
      accuracy: capturedAccuracy,
      pressureMethod,
      capturedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    setCaptureStep(4);
    setCapturing(false);

    return () => {
      sensorStopRef.current?.();
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const polygon = parsePolygon(polygonText);
    const hasInvalidPoint = polygon.some(
      (point) => Number.isNaN(point.lat) || Number.isNaN(point.lng)
    );

    if (polygon.length < 3 || hasInvalidPoint) {
      setError('Enter at least 3 valid geofence points as latitude, longitude');
      return;
    }

    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          polygon,
          altitudeMeters: altCapture.altitudeMeters ?? undefined,
          pressureHpa: altCapture.pressureHpa ?? undefined,
          altitudeTolerance,
        }),
      });

      if (response.ok) {
        setSuccess('Classroom created successfully!');
        setFormData(emptyForm);
        setPolygonText('');
        setAltCapture(emptyAltitude);
        setAltitudeTolerance(4.0);
        setShowForm(false);
        setTimeout(() => setSuccess(''), 3000);
        fetchClassrooms();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create classroom');
      }
    } catch (err) {
      setError('An error occurred while creating classroom');
      console.error('Error creating classroom:', err);
    }
  };

  const deleteClassroom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return;

    try {
      setError('');
      setSuccess('');
      const response = await fetch(`/api/classrooms/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Classroom deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
        fetchClassrooms();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete classroom');
      }
    } catch (err) {
      setError('Error deleting classroom');
      console.error('Error deleting classroom:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-400 font-semibold text-sm animate-pulse">Loading classrooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden text-zinc-100">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-mesh-dark opacity-40 pointer-events-none"></div>

      {/* Floating Glowing Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <nav className="nav-bar border-b border-white/5">
        <div className="container-page flex items-center justify-between py-4">
          <Link href="/" className="nav-brand flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-violet-500" />
            OnGrid Instructor
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/teacher/dashboard" className="nav-link text-zinc-400 hover:text-white font-bold transition-colors">
              Dashboard
            </Link>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-xs font-bold text-white">{session?.user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 container-page py-12 relative z-10 animate-fade-in">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="heading-display mb-3 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-violet-400" />
              Classrooms Geofencing
            </h1>
            <p className="text-zinc-400 text-base max-w-lg">
              Define 3D boundary limits — horizontal polygon + altitude floor verification.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((current) => !current);
              setError('');
            }}
            className={`btn ${showForm ? 'btn-secondary border-white/10' : 'btn-primary shadow-[0_0_40px_rgba(139,92,246,0.3)]'} h-14 px-8 flex items-center gap-2`}
          >
            {showForm ? (
              <>
                <X className="w-5 h-5 mr-1" />
                <span>Close Panel</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-1" />
                <span>Add Classroom</span>
              </>
            )}
          </button>
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

        {/* Create Classroom Form Card */}
        {showForm && (
          <div className="card-premium mb-12 max-w-3xl animate-fade-in border-white/10 bg-white/[0.02]">
            <div className="pb-6 mb-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-400" />
                </div>
                Create New Classroom
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="label text-zinc-300">Classroom Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Lecture Hall A"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input bg-black/40 border-white/10 text-white placeholder-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label text-zinc-300">Room Number / ID</label>
                  <input
                    type="text"
                    placeholder="e.g., 101A"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="input bg-black/40 border-white/10 text-white placeholder-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label text-zinc-300">Building Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Academic Block A"
                    value={formData.building}
                    onChange={(e) =>
                      setFormData({ ...formData, building: e.target.value })
                    }
                    className="input bg-black/40 border-white/10 text-white placeholder-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label text-zinc-300">Floor Level</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                      <Layers className="w-5 h-5" />
                    </span>
                    <input
                      type="number"
                      placeholder="e.g., 2"
                      value={formData.floor === 0 ? '' : formData.floor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          floor: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="input pl-12 bg-black/40 border-white/10 text-white placeholder-zinc-600 focus:border-violet-500 focus:ring-violet-500/20"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0 text-zinc-300">Geofence Coordinates (Lat, Lng)</label>
                  <span className="text-xs text-violet-400 font-bold flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    One vertex pair per line
                  </span>
                </div>
                <textarea
                  value={polygonText}
                  onChange={(e) => setPolygonText(e.target.value)}
                  placeholder={'28.6139, 77.2090\n28.6142, 77.2093\n28.6137, 77.2095'}
                  className="textarea font-mono text-sm min-h-[160px] bg-black/40 border-white/10 text-white placeholder-zinc-700 focus:border-violet-500 focus:ring-violet-500/20 leading-relaxed"
                  required
                />
                <p className="text-sm text-zinc-500 font-medium leading-normal mt-3">
                  Enter at least 3 points forming a boundary polygon. Separate latitude and longitude with a comma. You can mark the area by walking to the corners of the class and using the capture button below.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={captureGpsPoint}
                    disabled={isCapturingGps}
                    className="btn btn-secondary py-2.5 px-4 text-sm font-bold border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    {isCapturingGps ? 'Locking GPS...' : 'Capture Current Location as Corner'}
                  </button>
                </div>
              </div>

              {/* ─── Altitude Calibration Panel ─────────────────────────────── */}
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Radio className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-indigo-300">
                        3D Floor Calibration
                      </h3>
                      <p className="text-xs text-indigo-400/60 font-semibold mt-0.5">Altitude Verification via Barometer</p>
                    </div>
                  </div>
                  <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs py-1 px-3">Optional but Recommended</span>
                </div>

                <p className="text-sm text-indigo-200/60 leading-relaxed">
                  Stand inside the classroom and click <strong>Capture My Altitude</strong>. OnGrid will read your device&apos;s barometric pressure and GPS altitude to create a 3D reference — students on different floors will be rejected even if the GPS coordinates match.
                </p>

                {/* Capture Button */}
                {captureStep === 0 && (
                  <button
                    type="button"
                    onClick={captureAltitude}
                    disabled={capturing}
                    className="btn btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-6 border-indigo-500/30 text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20"
                  >
                    <Navigation className="w-5 h-5" />
                    Capture My Altitude
                  </button>
                )}

                {/* Sensor Reading Progress */}
                {capturing && (
                  <div className="space-y-3 animate-fade-in bg-black/20 rounded-xl p-4 border border-white/5">
                    <div className={`flex items-center gap-3 text-sm font-semibold ${captureStep >= 1 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${captureStep >= 1 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700'}`}>
                        {captureStep >= 1 && <span className="text-[10px]">✓</span>}
                      </span>
                      Reading barometric pressure sensor...
                    </div>
                    <div className={`flex items-center gap-3 text-sm font-semibold ${captureStep >= 2 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${captureStep >= 2 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700'}`}>
                        {captureStep >= 2 && <span className="text-[10px]">✓</span>}
                      </span>
                      Locking GPS altitude...
                    </div>
                    <div className={`flex items-center gap-3 text-sm font-semibold ${captureStep >= 3 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${captureStep >= 3 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700'}`}>
                        {captureStep >= 3 && <span className="text-[10px]">✓</span>}
                      </span>
                      Finalising altitude reference...
                    </div>
                  </div>
                )}

                {/* Captured Readings Display */}
                {captureStep === 4 && !capturing && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Pressure */}
                      <div className="rounded-2xl bg-black/40 border border-indigo-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2 text-indigo-400">
                          <Gauge className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Pressure</span>
                        </div>
                        {altCapture.pressureHpa != null ? (
                          <p className="text-3xl font-display font-extrabold text-white">
                            {altCapture.pressureHpa.toFixed(2)}
                            <span className="text-sm font-semibold text-zinc-500 ml-1">hPa</span>
                          </p>
                        ) : (
                          <p className="text-sm text-zinc-500 font-semibold">Not available</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">{altCapture.pressureMethod}</p>
                      </div>

                      {/* GPS Altitude */}
                      <div className="rounded-2xl bg-black/40 border border-indigo-500/20 p-4">
                        <div className="flex items-center gap-2 mb-2 text-violet-400">
                          <MoveVertical className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">GPS Alt</span>
                        </div>
                        {altCapture.altitudeMeters != null ? (
                          <p className="text-3xl font-display font-extrabold text-white">
                            {altCapture.altitudeMeters.toFixed(1)}
                            <span className="text-sm font-semibold text-zinc-500 ml-1">m ASL</span>
                          </p>
                        ) : (
                          <p className="text-sm text-zinc-500 font-semibold">No satellite fix</p>
                        )}
                        {altCapture.accuracy != null && (
                          <p className="text-xs text-zinc-500 mt-1">±{altCapture.accuracy.toFixed(0)}m accuracy</p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center gap-3 text-sm font-semibold rounded-xl px-4 py-3 ${(altCapture.pressureHpa != null || altCapture.altitudeMeters != null) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {(altCapture.pressureHpa != null || altCapture.altitudeMeters != null) ? (
                        <>
                          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                          3D calibration captured at {altCapture.capturedAt} — floor check will be active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          No sensor data captured — this classroom will use 2D geofencing only
                        </>
                      )}
                    </div>

                    {/* Recapture button */}
                    <button
                      type="button"
                      onClick={() => { setCaptureStep(0); setAltCapture(emptyAltitude); }}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-indigo-400 transition-colors font-bold"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Recapture Data
                    </button>
                  </div>
                )}

                {/* Tolerance Slider */}
                {(captureStep === 4 && !capturing) && (
                  <div className="pt-4 border-t border-indigo-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        Altitude Tolerance
                      </label>
                      <span className="text-sm font-extrabold text-indigo-400">
                        ±{altitudeTolerance.toFixed(1)} m
                        <span className="ml-1.5 text-indigo-200/50 font-normal">
                          (~{(altitudeTolerance / 3.5).toFixed(1)} floors)
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={altitudeTolerance}
                      onChange={(e) => setAltitudeTolerance(parseFloat(e.target.value))}
                      className="w-full h-3 rounded-full appearance-none bg-black/40 border border-white/5 accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-zinc-500 mt-2 font-semibold">
                      <span>Strict (1m)</span>
                      <span>Lenient (15m)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/10">
                <button type="submit" className="flex-[2] btn btn-primary h-14 text-base shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                  Create Classroom
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                    setCaptureStep(0);
                    setAltCapture(emptyAltitude);
                  }}
                  className="btn btn-secondary flex-1 h-14 text-base border-white/10 bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classrooms List */}
        {classrooms.length === 0 ? (
          <div className="card-premium py-20 text-center max-w-xl mx-auto border-dashed border-white/10 bg-white/5">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500 border border-white/10">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">No classrooms registered</h2>
            <p className="text-zinc-500 text-base mt-2 max-w-md mx-auto leading-relaxed">
              Create a classroom geofence boundary so that you can create attendance sessions linked to them.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-8 h-14 px-8 shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            >
              Add Your First Classroom
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="card-premium flex flex-col justify-between border-white/5 bg-white/5 hover:border-violet-500/30 transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-display font-bold text-white tracking-tight leading-tight mb-1">
                        {classroom.name}
                      </h2>
                      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Room {classroom.label}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="badge bg-violet-500/20 text-violet-300 border border-violet-500/30 py-1 px-2.5 flex items-center gap-1.5">
                        <Map className="w-3.5 h-3.5" />
                        Geofenced
                      </span>
                      {(classroom.pressureHpa != null || classroom.altitudeMeters != null) && (
                        <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-1 px-2.5 flex items-center gap-1.5">
                          <MoveVertical className="w-3.5 h-3.5" />
                          3D Floor
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SVG Geofence Visualizer Card */}
                  <div className="rounded-2xl overflow-hidden border border-white/5 mb-6 opacity-80 hover:opacity-100 transition-opacity">
                    <GeofencePreview polygon={classroom.polygon} className="" />
                  </div>

                  <div className="space-y-3 text-sm text-zinc-400 font-medium py-4 border-t border-b border-white/5 mb-6 bg-black/20 -mx-6 px-6">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span>{classroom.building}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span>Floor level {classroom.floor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <span>{classroom.polygon.length} boundary vertices</span>
                    </div>
                    {/* Altitude calibration status */}
                    {classroom.pressureHpa != null ? (
                      <div className="flex items-center gap-3 text-indigo-400">
                        <Gauge className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">{classroom.pressureHpa.toFixed(1)} hPa · ±{classroom.altitudeTolerance}m</span>
                      </div>
                    ) : classroom.altitudeMeters != null ? (
                      <div className="flex items-center gap-3 text-violet-400">
                        <MoveVertical className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">{classroom.altitudeMeters.toFixed(1)}m GPS · ±{classroom.altitudeTolerance}m</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-zinc-500">
                        <Radio className="w-4 h-4 flex-shrink-0" />
                        <span>2D geofence only</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => deleteClassroom(classroom.id)}
                    className="w-full btn h-12 text-sm font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors flex items-center justify-center gap-2 border-none"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Geofence</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
