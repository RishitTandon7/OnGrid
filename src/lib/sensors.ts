/**
 * OnGrid Sensor Fusion Library
 *
 * Collects all available device sensor signals to determine altitude/floor
 * and produce a confidence score for 3D geofence validation.
 *
 * Signal priority:
 *   1. Barometric pressure (AbsolutePressureSensor) — ±0.5 m, best for floors
 *   2. GPS altitude (navigator.geolocation coords.altitude) — ±3–10 m
 *   3. Device orientation (DeviceOrientationEvent) — validates posture
 *   4. Accelerometer + gyroscope (DeviceMotionEvent) — anti-spoofing
 *   5. Declared floor number (Classroom.floor) — coarse fallback
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SensorReading {
  /** Barometric pressure in hPa, null if sensor unavailable */
  pressureHpa: number | null;
  /** GPS altitude above sea level in metres, null if unavailable */
  gpsAltitude: number | null;
  /** GPS altitude accuracy in metres, null if unavailable */
  gpsAltitudeAccuracy: number | null;
  /** GPS latitude */
  lat: number;
  /** GPS longitude */
  lng: number;
  /** GPS horizontal accuracy in metres */
  gpsAccuracy: number;
  /** Device orientation: alpha (compass), beta (front/back tilt), gamma (left/right tilt) */
  orientation: { alpha: number | null; beta: number | null; gamma: number | null };
  /** Linear acceleration magnitude in m/s² (0 = perfectly stationary) */
  accelerationMagnitude: number | null;
  /** Gyroscope rotation rate magnitude in deg/s (0 = not rotating) */
  rotationMagnitude: number | null;
  /** Whether the device appears to be held stationary */
  isStationary: boolean;
  /** ISO timestamp of when sensors were sampled */
  sampledAt: string;
  /** Which pressure method was used */
  pressureMethod: 'AbsolutePressureSensor' | 'none';
}

export interface FloorConfidenceResult {
  /** 0.0–1.0, where 1.0 is certain match */
  score: number;
  /** Human-readable explanation of the score */
  explanation: string;
  /** Estimated altitude delta in metres (student vs classroom) */
  altitudeDeltaMeters: number | null;
  /** Which method was the primary validator */
  primaryMethod: 'pressure' | 'gps_altitude' | 'floor_number' | 'unknown';
  /** Whether the floor check passed */
  passed: boolean;
}

// ─── Barometric Pressure ──────────────────────────────────────────────────────

/**
 * Read barometric pressure using the Generic Sensor API (AbsolutePressureSensor).
 * Returns null if the sensor is not available.
 * Requires HTTPS and Chromium-based browser.
 */
export async function readBarometricPressure(): Promise<{
  pressureHpa: number | null;
  method: 'AbsolutePressureSensor' | 'none';
}> {
  // AbsolutePressureSensor is in the Generic Sensor API
  if (typeof window === 'undefined') return { pressureHpa: null, method: 'none' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;

  if (win.AbsolutePressureSensor) {
    return new Promise((resolve) => {
      try {
        const sensor = new win.AbsolutePressureSensor({ frequency: 5 });

        const timeout = setTimeout(() => {
          sensor.stop();
          resolve({ pressureHpa: null, method: 'none' });
        }, 3000);

        sensor.addEventListener('reading', () => {
          clearTimeout(timeout);
          sensor.stop();
          // sensor.pressure is in hPa
          resolve({
            pressureHpa: sensor.pressure ?? null,
            method: 'AbsolutePressureSensor',
          });
        });

        sensor.addEventListener('error', () => {
          clearTimeout(timeout);
          resolve({ pressureHpa: null, method: 'none' });
        });

        sensor.start();
      } catch {
        resolve({ pressureHpa: null, method: 'none' });
      }
    });
  }

  return { pressureHpa: null, method: 'none' };
}

// ─── GPS Position + Altitude ───────────────────────────────────────────────────

/**
 * Get high-accuracy GPS position including altitude if the device provides it.
 */
export function readGpsPosition(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
        });
      },
      (err) => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
}

// ─── Device Motion (Accelerometer + Gyroscope) ───────────────────────────────

/**
 * Sample DeviceMotionEvent for 600ms to measure motion magnitude.
 * Returns the average linear acceleration and rotation rate magnitudes.
 */
export function readDeviceMotion(): Promise<{
  accelerationMagnitude: number | null;
  rotationMagnitude: number | null;
  isStationary: boolean;
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      resolve({ accelerationMagnitude: null, rotationMagnitude: null, isStationary: true });
      return;
    }

    const accSamples: number[] = [];
    const rotSamples: number[] = [];

    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (a && a.x != null && a.y != null && a.z != null) {
        // Subtract ~9.8 from the dominant axis to get linear acceleration
        const mag = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);
        accSamples.push(Math.abs(mag - 9.81));
      }

      const r = e.rotationRate;
      if (r && r.alpha != null && r.beta != null && r.gamma != null) {
        const rotMag = Math.sqrt(r.alpha ** 2 + r.beta ** 2 + r.gamma ** 2);
        rotSamples.push(rotMag);
      }
    };

    window.addEventListener('devicemotion', handler);

    setTimeout(() => {
      window.removeEventListener('devicemotion', handler);

      const avgAcc =
        accSamples.length > 0
          ? accSamples.reduce((s, v) => s + v, 0) / accSamples.length
          : null;

      const avgRot =
        rotSamples.length > 0
          ? rotSamples.reduce((s, v) => s + v, 0) / rotSamples.length
          : null;

      // Stationary = low linear acceleration and low rotation rate
      const isStationary =
        avgAcc == null || (avgAcc < 0.5 && (avgRot == null || avgRot < 10));

      resolve({
        accelerationMagnitude: avgAcc,
        rotationMagnitude: avgRot,
        isStationary,
      });
    }, 600);
  });
}

// ─── Device Orientation ───────────────────────────────────────────────────────

/**
 * Read device orientation (compass heading and tilt angles).
 */
export function readDeviceOrientation(): Promise<{
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      resolve({ alpha: null, beta: null, gamma: null });
      return;
    }

    const handler = (e: DeviceOrientationEvent) => {
      window.removeEventListener('deviceorientation', handler);
      resolve({ alpha: e.alpha, beta: e.beta, gamma: e.gamma });
    };

    window.addEventListener('deviceorientation', handler);

    // Fallback if no event fires within 1s
    setTimeout(() => {
      window.removeEventListener('deviceorientation', handler);
      resolve({ alpha: null, beta: null, gamma: null });
    }, 1000);
  });
}

// ─── Barometric Formula ───────────────────────────────────────────────────────

/**
 * Convert pressure difference (hPa) to altitude difference (metres).
 * Uses the international barometric formula.
 *
 * @param referencePressure  Pressure at classroom (hPa) — teacher's calibration
 * @param studentPressure    Pressure at student's location (hPa)
 */
export function pressureDeltaToMeters(
  referencePressure: number,
  studentPressure: number
): number {
  // Barometric formula: Δh ≈ (T / L) * (1 - (P_student / P_ref) ^ (R*L/(g*M)))
  // Simplified approximation: each 1 hPa ≈ 8.5 m at sea level
  const METRES_PER_HPA = 8.5;
  return (referencePressure - studentPressure) * METRES_PER_HPA;
}

// ─── Main Sensor Collection ───────────────────────────────────────────────────

/**
 * Collect all available sensor readings in parallel.
 * This is the main function called during student check-in.
 *
 * @param onProgress  Optional callback called as each sensor step completes (0–4)
 */
export async function collectSensorReading(
  onProgress?: (step: number, label: string) => void
): Promise<SensorReading> {
  onProgress?.(1, 'Contacting GPS satellites...');

  // Run GPS + pressure + motion in parallel
  const [gpsResult, pressureResult, motionResult, orientationResult] =
    await Promise.allSettled([
      readGpsPosition(),
      readBarometricPressure(),
      readDeviceMotion(),
      readDeviceOrientation(),
    ]);

  onProgress?.(2, 'Reading barometric pressure sensor...');

  const gps =
    gpsResult.status === 'fulfilled'
      ? gpsResult.value
      : { lat: 0, lng: 0, accuracy: 9999, altitude: null, altitudeAccuracy: null };

  if (gpsResult.status === 'rejected') {
    throw new Error(gpsResult.reason?.message || 'GPS unavailable');
  }

  onProgress?.(3, 'Sampling accelerometer & gyroscope...');

  const pressure =
    pressureResult.status === 'fulfilled'
      ? pressureResult.value
      : { pressureHpa: null, method: 'none' as const };

  const motion =
    motionResult.status === 'fulfilled'
      ? motionResult.value
      : { accelerationMagnitude: null, rotationMagnitude: null, isStationary: true };

  const orientation =
    orientationResult.status === 'fulfilled'
      ? orientationResult.value
      : { alpha: null, beta: null, gamma: null };

  onProgress?.(4, 'Computing 3D sensor confidence score...');

  return {
    pressureHpa: pressure.pressureHpa,
    gpsAltitude: gps.altitude,
    gpsAltitudeAccuracy: gps.altitudeAccuracy,
    lat: gps.lat,
    lng: gps.lng,
    gpsAccuracy: gps.accuracy,
    orientation,
    accelerationMagnitude: motion.accelerationMagnitude,
    rotationMagnitude: motion.rotationMagnitude,
    isStationary: motion.isStationary,
    sampledAt: new Date().toISOString(),
    pressureMethod: pressure.method,
  };
}

// ─── Floor Confidence Scoring ─────────────────────────────────────────────────

/**
 * Compute a 0–1 floor confidence score by comparing sensor data
 * against a classroom's stored altitude reference.
 *
 * @param reading   Sensor reading from student's device
 * @param classroom Classroom's stored altitude reference data
 */
export function computeFloorConfidence(
  reading: SensorReading,
  classroom: {
    altitudeMeters: number | null;
    pressureHpa: number | null;
    altitudeTolerance: number;
    floor: number;
  }
): FloorConfidenceResult {
  // ── 1. Pressure-based floor comparison (most accurate) ──────────────────
  if (classroom.pressureHpa != null && reading.pressureHpa != null) {
    const deltaMeters = pressureDeltaToMeters(classroom.pressureHpa, reading.pressureHpa);
    const absDelta = Math.abs(deltaMeters);
    const tolerance = classroom.altitudeTolerance;

    let score: number;
    if (absDelta <= tolerance * 0.5) {
      score = 1.0; // Dead centre — perfect match
    } else if (absDelta <= tolerance) {
      score = 0.8 - (absDelta - tolerance * 0.5) / (tolerance * 0.5) * 0.3;
    } else if (absDelta <= tolerance * 2) {
      score = 0.5 - (absDelta - tolerance) / tolerance * 0.4;
    } else {
      score = Math.max(0, 0.1 - absDelta / 100);
    }

    // Penalise if device is not stationary (potential spoofing)
    if (!reading.isStationary) {
      score *= 0.85;
    }

    return {
      score,
      altitudeDeltaMeters: deltaMeters,
      primaryMethod: 'pressure',
      passed: absDelta <= tolerance,
      explanation:
        absDelta <= tolerance
          ? `Pressure match ✓ (Δ${absDelta.toFixed(1)}m, within ${tolerance}m tolerance)`
          : `Floor mismatch ✗ — pressure indicates you are ~${absDelta.toFixed(0)}m ${deltaMeters > 0 ? 'below' : 'above'} the classroom`,
    };
  }

  // ── 2. GPS altitude comparison (less accurate indoors) ──────────────────
  if (classroom.altitudeMeters != null && reading.gpsAltitude != null) {
    const deltaMeters = reading.gpsAltitude - classroom.altitudeMeters;
    const absDelta = Math.abs(deltaMeters);
    // GPS altitude is less accurate so use double the tolerance
    const effectiveTolerance = classroom.altitudeTolerance * 2.5;

    const passed = absDelta <= effectiveTolerance;
    const score = passed ? Math.max(0.6, 1.0 - absDelta / effectiveTolerance * 0.4) : 0.2;

    return {
      score,
      altitudeDeltaMeters: deltaMeters,
      primaryMethod: 'gps_altitude',
      passed,
      explanation: passed
        ? `GPS altitude match ✓ (Δ${absDelta.toFixed(1)}m)`
        : `GPS altitude mismatch ✗ — ~${absDelta.toFixed(0)}m ${deltaMeters > 0 ? 'above' : 'below'} classroom`,
    };
  }

  // ── 3. Floor number fallback (coarse — skipped if no altitude data stored) ─
  // If no calibration has been set, pass with reduced confidence
  return {
    score: 0.5,
    altitudeDeltaMeters: null,
    primaryMethod: 'unknown',
    passed: true, // No calibration data → don't block students
    explanation: 'No altitude calibration set for this classroom — floor check skipped',
  };
}
