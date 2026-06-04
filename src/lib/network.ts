/**
 * src/lib/network.ts
 *
 * IP-based network validation for per-building WiFi checks.
 *
 * Strategy: Compare the first 3 octets (/24 subnet) of two IPv4 addresses.
 * This means students and the teacher must be on the same building switch
 * (e.g. teacher 192.168.10.5 validates student 192.168.10.x, but NOT 192.168.11.x).
 *
 * IPv6 / "unknown" / proxied IPs are handled gracefully — if we can't determine
 * subnet, we allow the request through (fail-open) and log a warning.
 */

/**
 * Extract a normalised IPv4 address from a raw header value.
 * Handles x-forwarded-for chains ("1.2.3.4, 5.6.7.8" → "1.2.3.4") and
 * IPv4-mapped IPv6 addresses ("::ffff:1.2.3.4" → "1.2.3.4").
 */
export function extractIpv4(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Take the first IP in a comma-separated x-forwarded-for chain
  const first = raw.split(',')[0].trim();

  // Strip IPv4-mapped IPv6 prefix
  const mapped = first.replace(/^::ffff:/i, '');

  // Validate it looks like an IPv4 address
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(mapped)) {
    return mapped;
  }

  return null;
}

/**
 * Returns the /24 subnet prefix of an IPv4 address (first 3 octets).
 * e.g. "192.168.10.55" → "192.168.10"
 */
export function getSubnet24(ip: string): string {
  return ip.split('.').slice(0, 3).join('.');
}

/**
 * Checks whether a student's IP is on the same /24 subnet as the teacher's IP.
 *
 * @param teacherIp  - IP stored on the AttendanceSession (captured at session start)
 * @param studentIp  - IP from the current student request
 * @returns { allowed: boolean; reason: string }
 */
export function isSameSubnet(
  teacherIp: string | null | undefined,
  studentIp: string | null | undefined
): { allowed: boolean; reason: string } {
  const teacher = extractIpv4(teacherIp);
  const student = extractIpv4(studentIp);

  if (!teacher) {
    // Teacher IP was never stored or is non-IPv4 — allow through (fail-open)
    return { allowed: true, reason: 'teacher-ip-unavailable' };
  }

  if (!student) {
    // Can't read student IP — allow through and log; better than false-blocking
    return { allowed: true, reason: 'student-ip-unavailable' };
  }

  if (getSubnet24(teacher) === getSubnet24(student)) {
    return { allowed: true, reason: 'same-subnet' };
  }

  return {
    allowed: false,
    reason: `not-on-campus-network — your device (${getSubnet24(student)}.x) is not on the same network as the classroom (${getSubnet24(teacher)}.x)`,
  };
}
