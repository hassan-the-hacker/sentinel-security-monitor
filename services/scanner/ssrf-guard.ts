import dns from "dns/promises";
import net from "net";

export class SSRFSecurityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSRFSecurityException";
  }
}

/**
 * Checks if an IPv4 address is in private, loopback, link-local, multicast, or reserved ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Treat invalid IPv4 as blocked
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private-Use Networks RFC 1918)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback RFC 1122)
  if (a === 127) return true;

  // 100.64.0.0/10 (Shared Address Space / Carrier Grade NAT RFC 6598)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 169.254.0.0/16 (Link Local RFC 3927, includes cloud metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private-Use Networks RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 192.168.0.0/16 (Private-Use Networks RFC 1918)
  if (a === 192 && b === 168) return true;

  // 198.18.0.0/15 (Network Interconnect Device Benchmark Testing)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast RFC 5771: 224.0.0.0 - 239.255.255.255)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved for Future Use RFC 1112: 240.0.0.0 - 255.255.255.254)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in private, loopback, link-local, multicast, or documentation ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // Unspecified ::
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // Unique local addresses fc00::/7 (fc00:: through fdff::)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-local unicast fe80::/10 (fe80:: through febf::)
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  // Multicast ff00::/8
  if (normalized.startsWith("ff")) return true;

  // IPv4-mapped IPv6 ::ffff:x.x.x.x
  if (normalized.includes("::ffff:")) {
    const v4Part = normalized.split("::ffff:")[1];
    if (net.isIPv4(v4Part)) {
      return isPrivateOrReservedIPv4(v4Part);
    }
    return true;
  }

  // Documentation 2001:db8::/32
  if (normalized.startsWith("2001:db8") || normalized.startsWith("2001:0db8")) return true;

  return false;
}

export function isPrivateOrReservedIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return isPrivateOrReservedIPv4(ip);
  }
  if (net.isIPv6(ip)) {
    return isPrivateOrReservedIPv6(ip);
  }
  return true; // Unknown IP format is rejected
}

/**
 * Validates target domain and performs strict DNS pre-flight SSRF inspection.
 * Rejects localhost, IPs, intranet names, private subnets, cloud metadata.
 */
export async function validateAndResolveTarget(target: string): Promise<{
  domain: string;
  resolvedIps: string[];
  safeTargetUrl: string;
}> {
  if (!target || typeof target !== "string") {
    throw new SSRFSecurityException("No target domain provided.");
  }

  // 1. Clean input
  let cleaned = target.trim().toLowerCase();

  // Strip protocol if user included it
  if (cleaned.startsWith("http://")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("https://")) {
    cleaned = cleaned.substring(8);
  }

  // Strip paths, queries, credentials, fragments, port
  cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0].split("@").pop() || "";
  const host = cleaned.split(":")[0];

  if (!host) {
    throw new SSRFSecurityException("Target domain is empty or malformed.");
  }

  // 2. Reject explicit banned keywords
  const bannedHostnames = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "169.254.169.254",
    "instance-data",
  ];
  if (bannedHostnames.includes(host) || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    throw new SSRFSecurityException(`Target host '${host}' is restricted or points to internal infrastructure.`);
  }

  // Reject direct raw IP entries to enforce scanning authorized domain names
  if (net.isIP(host)) {
    if (isPrivateOrReservedIP(host)) {
      throw new SSRFSecurityException(`Target IP '${host}' belongs to a private, loopback, or reserved range.`);
    }
  }

  // 3. Domain regex verification
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  if (!domainRegex.test(host)) {
    throw new SSRFSecurityException(`'${host}' is not a valid fully qualified domain name (FQDN).`);
  }

  // 4. Pre-flight DNS resolution and IP verification
  let resolvedIps: string[] = [];
  try {
    const lookupResults = await dns.lookup(host, { all: true });
    resolvedIps = lookupResults.map((r) => r.address);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DNS resolution failed";
    throw new SSRFSecurityException(`Failed to resolve DNS for '${host}': ${msg}`);
  }

  if (resolvedIps.length === 0) {
    throw new SSRFSecurityException(`Domain '${host}' did not resolve to any active IP address.`);
  }

  // 5. Inspect EVERY resolved IP address against private/reserved ranges
  for (const ip of resolvedIps) {
    if (isPrivateOrReservedIP(ip)) {
      throw new SSRFSecurityException(
        `Security Exception: Domain '${host}' resolved to restricted address ${ip}. Connection aborted.`
      );
    }
  }

  return {
    domain: host,
    resolvedIps,
    safeTargetUrl: `https://${host}`,
  };
}

