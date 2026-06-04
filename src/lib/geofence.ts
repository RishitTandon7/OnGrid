/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if IP is in CIDR range
 */
export function isIpInRange(ip: string, cidr: string): boolean {
  const [range, prefix] = cidr.split('/');
  const rangeNum = ipToNumber(range);
  const prefixNum = parseInt(prefix, 10);
  const ipNum = ipToNumber(ip);
  const mask = -1 << (32 - prefixNum);

  return (rangeNum & mask) === (ipNum & mask);
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  return (
    (parseInt(parts[0], 10) << 24) +
    (parseInt(parts[1], 10) << 16) +
    (parseInt(parts[2], 10) << 8) +
    parseInt(parts[3], 10)
  );
}

// ─── Altitude / Floor Validation ─────────────────────────────────────────────

const METRES_PER_HPA = 8.5; // Barometric approximation: 1 hPa ≈ 8.5 m

/**
 * Server-side altitude gate.
 * Compares the student's reported sensor data against the classroom's
 * calibrated reference. Returns whether the student appears to be on the
 * correct floor and the computed vertical delta.
 */
export function isAltitudeValid(
  student: { altitude: number | null | undefined; pressure: number | null | undefined },
  classroom: {
    altitudeMeters: number | null;
    pressureHpa: number | null;
    altitudeTolerance: number;
  }
): { valid: boolean; deltaMeters: number | null; method: string } {
  // If classroom has no altitude calibration, skip the check (pass by default)
  if (classroom.pressureHpa == null && classroom.altitudeMeters == null) {
    return { valid: true, deltaMeters: null, method: 'uncalibrated' };
  }

  // ── Pressure comparison (preferred) ─────────────────────────────────────
  if (classroom.pressureHpa != null && student.pressure != null) {
    const deltaMeters =
      (classroom.pressureHpa - student.pressure) * METRES_PER_HPA;
    const absDelta = Math.abs(deltaMeters);
    return {
      valid: absDelta <= classroom.altitudeTolerance,
      deltaMeters,
      method: 'pressure',
    };
  }

  // ── GPS altitude comparison (fallback) ───────────────────────────────────
  if (classroom.altitudeMeters != null && student.altitude != null) {
    const deltaMeters = student.altitude - classroom.altitudeMeters;
    const absDelta = Math.abs(deltaMeters);
    // GPS is less accurate indoors — use 2.5× the stored tolerance
    return {
      valid: absDelta <= classroom.altitudeTolerance * 2.5,
      deltaMeters,
      method: 'gps_altitude',
    };
  }

  // ── No matching sensor data ─────────────────────────────────────────────
  // Classroom is calibrated but student's device has no sensors — still pass
  return { valid: true, deltaMeters: null, method: 'sensor_unavailable' };
}
