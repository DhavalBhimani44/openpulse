/**
 * Anonymize IP address for privacy
 * IPv4: Remove last octet (192.168.1.123 -> 192.168.1.0)
 * IPv6: Remove last 80 bits (simplified: truncate to /48)
 */
export function anonymizeIP(ip: string): string {
  if (!ip) return "";

  // IPv4
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  // IPv6
  if (ip.includes(":")) {
    const parts = ip.split(":");
    // Keep first 3 groups (48 bits)
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}::`;
    }
  }

  return ip;
}

/**
 * Extract IP from request headers
 */
export function getClientIP(headers: Headers): string {
  // Check various headers (in order of preference)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

