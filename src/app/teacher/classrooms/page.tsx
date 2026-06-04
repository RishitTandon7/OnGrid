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
  ArrowLeft,
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
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm">Loading classrooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Accent gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="nav-bar">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="nav-brand">
              OnGrid
            </Link>
            <div className="nav-menu">
              <Link href="/teacher/dashboard" className="nav-link">
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Classrooms Geofencing
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
              Define 3D boundary limits — horizontal polygon + altitude floor verification.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((current) => !current);
              setError('');
            }}
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2 self-start md:self-auto`}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                <span>Close Panel</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Classroom</span>
              </>
            )}
          </button>
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

        {/* Create Classroom Form Card */}
        {showForm && (
          <div className="card-premium mb-10 max-w-2xl animate-fade-in">
            <div className="pb-4 mb-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                Create New Classroom
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Classroom Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Lecture Hall A"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Room Number / ID</label>
                  <input
                    type="text"
                    placeholder="e.g., 101A"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Building Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Academic Block A"
                    value={formData.building}
                    onChange={(e) =>
                      setFormData({ ...formData, building: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Floor Level</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-600">
                      <Layers className="w-4 h-4" />
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
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Geofence Coordinates (Lat, Lng)</label>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    One vertex pair per line
                  </span>
                </div>
                <textarea
                  value={polygonText}
                  onChange={(e) => setPolygonText(e.target.value)}
                  placeholder={'28.6139, 77.2090\n28.6142, 77.2093\n28.6137, 77.2095'}
                  className="textarea font-mono text-xs min-h-[120px]"
                  required
                />
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium leading-normal mt-1.5">
                  Enter at least 3 points forming a boundary polygon. Separate latitude and longitude with a comma.
                </p>
              </div>

              {/* ─── Altitude Calibration Panel ─────────────────────────────── */}
              <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/10 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                      3D Floor Calibration
                    </h3>
                    <span className="badge badge-primary text-[10px] py-0.5 px-2">Optional but Recommended</span>
                  </div>
                </div>

                <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed">
                  Stand inside the classroom and click <strong>Capture My Altitude</strong>. OnGrid will read your device&apos;s barometric pressure and GPS altitude to create a 3D reference — students on different floors will be rejected even if the GPS coordinates match.
                </p>

                {/* Capture Button */}
                {captureStep === 0 && (
                  <button
                    type="button"
                    onClick={captureAltitude}
                    disabled={capturing}
                    className="btn btn-secondary flex items-center gap-2 text-sm border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30"
                  >
                    <Navigation className="w-4 h-4" />
                    Capture My Altitude
                  </button>
                )}

                {/* Sensor Reading Progress */}
                {capturing && (
                  <div className="space-y-2 animate-fade-in">
                    <div className={`flex items-center gap-2 text-xs font-semibold ${captureStep >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${captureStep >= 1 ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300'}`}>
                        {captureStep >= 1 && <span className="text-[8px]">✓</span>}
                      </span>
                      Reading barometric pressure sensor...
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${captureStep >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${captureStep >= 2 ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300'}`}>
                        {captureStep >= 2 && <span className="text-[8px]">✓</span>}
                      </span>
                      Locking GPS altitude...
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${captureStep >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center ${captureStep >= 3 ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300'}`}>
                        {captureStep >= 3 && <span className="text-[8px]">✓</span>}
                      </span>
                      Finalising altitude reference...
                    </div>
                  </div>
                )}

                {/* Captured Readings Display */}
                {captureStep === 4 && !capturing && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Pressure */}
                      <div className="rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-indigo-100 dark:border-indigo-900/30 p-3">
                        <div className="flex items-center gap-1.5 mb-1 text-indigo-600 dark:text-indigo-400">
                          <Gauge className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Pressure</span>
                        </div>
                        {altCapture.pressureHpa != null ? (
                          <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                            {altCapture.pressureHpa.toFixed(2)}
                            <span className="text-xs font-semibold text-zinc-400 ml-1">hPa</span>
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 font-semibold">Not available</p>
                        )}
                        <p className="text-[10px] text-zinc-400 mt-0.5">{altCapture.pressureMethod}</p>
                      </div>

                      {/* GPS Altitude */}
                      <div className="rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-indigo-100 dark:border-indigo-900/30 p-3">
                        <div className="flex items-center gap-1.5 mb-1 text-violet-600 dark:text-violet-400">
                          <MoveVertical className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">GPS Alt</span>
                        </div>
                        {altCapture.altitudeMeters != null ? (
                          <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                            {altCapture.altitudeMeters.toFixed(1)}
                            <span className="text-xs font-semibold text-zinc-400 ml-1">m ASL</span>
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-400 font-semibold">No satellite fix</p>
                        )}
                        {altCapture.accuracy != null && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">±{altCapture.accuracy.toFixed(0)}m accuracy</p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 ${(altCapture.pressureHpa != null || altCapture.altitudeMeters != null) ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'}`}>
                      {(altCapture.pressureHpa != null || altCapture.altitudeMeters != null) ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          3D calibration captured at {altCapture.capturedAt} — floor check will be active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          No sensor data captured — this classroom will use 2D geofencing only
                        </>
                      )}
                    </div>

                    {/* Recapture button */}
                    <button
                      type="button"
                      onClick={() => { setCaptureStep(0); setAltCapture(emptyAltitude); }}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-500 transition-colors font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Recapture
                    </button>
                  </div>
                )}

                {/* Tolerance Slider */}
                {(captureStep === 4 && !capturing) && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5" />
                        Altitude Tolerance
                      </label>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        ±{altitudeTolerance.toFixed(1)} m
                        <span className="ml-1 text-zinc-400 font-normal">
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
                      className="w-full h-2 rounded-full appearance-none bg-indigo-200 dark:bg-indigo-900/60 accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>Strict (1m)</span>
                      <span>Lenient (15m)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 btn btn-primary">
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
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Classrooms List */}
        {classrooms.length === 0 ? (
          <div className="card py-16 text-center max-w-xl mx-auto border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-5 text-zinc-400 dark:text-zinc-600">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">No classrooms registered</h2>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
              Create a classroom geofence boundary so that you can create attendance sessions linked to them.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-6"
            >
              Add Your First Classroom
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="card flex flex-col justify-between hover:scale-[1.01]">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                        {classroom.name}
                      </h2>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold mt-1">Room {classroom.label}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="badge badge-primary flex items-center gap-1">
                        <Map className="w-3 h-3" />
                        Geofenced
                      </span>
                      {(classroom.pressureHpa != null || classroom.altitudeMeters != null) && (
                        <span className="badge flex items-center gap-1 bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
                          <MoveVertical className="w-3 h-3" />
                          3D
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SVG Geofence Visualizer Card */}
                  <GeofencePreview polygon={classroom.polygon} className="mb-4" />

                  <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium py-3 border-t border-zinc-100 dark:border-zinc-800/80 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <span>{classroom.building}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <span>Floor level {classroom.floor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                      <span>{classroom.polygon.length} boundary vertices</span>
                    </div>
                    {/* Altitude calibration status */}
                    {classroom.pressureHpa != null ? (
                      <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                        <Gauge className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">{classroom.pressureHpa.toFixed(1)} hPa · ±{classroom.altitudeTolerance}m tolerance</span>
                      </div>
                    ) : classroom.altitudeMeters != null ? (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <MoveVertical className="w-4 h-4 flex-shrink-0" />
                        <span className="font-semibold">{classroom.altitudeMeters.toFixed(1)}m GPS alt · ±{classroom.altitudeTolerance}m tolerance</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                        <Radio className="w-4 h-4 flex-shrink-0" />
                        <span>2D geofence only (no altitude calibration)</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteClassroom(classroom.id)}
                  className="w-full btn btn-secondary dark:bg-zinc-800/40 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 dark:border-zinc-700/40 hover:border-rose-200/50 btn-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Geofence</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
