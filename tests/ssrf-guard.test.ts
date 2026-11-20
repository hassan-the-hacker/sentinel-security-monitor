import { describe, it, expect } from "vitest";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateOrReservedIP,
  validateAndResolveTarget,
  SSRFSecurityException,
} from "@/services/scanner/ssrf-guard";

describe("SSRF Guard - IP Range Defense", () => {
  it("should block loopback IPv4 addresses (127.0.0.0/8)", () => {
    expect(isPrivateOrReservedIPv4("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIPv4("127.1.2.3")).toBe(true);
    expect(isPrivateOrReservedIPv4("127.255.255.255")).toBe(true);
  });

  it("should block RFC 1918 Class A private addresses (10.0.0.0/8)", () => {
    expect(isPrivateOrReservedIPv4("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIPv4("10.254.1.1")).toBe(true);
  });

  it("should block RFC 1918 Class B private addresses (172.16.0.0/12)", () => {
    expect(isPrivateOrReservedIPv4("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedIPv4("172.24.10.5")).toBe(true);
    expect(isPrivateOrReservedIPv4("172.31.255.254")).toBe(true);
    // Public IPs outside 172.16-31 should NOT be blocked by this rule
    expect(isPrivateOrReservedIPv4("172.32.0.1")).toBe(false);
    expect(isPrivateOrReservedIPv4("172.15.0.1")).toBe(false);
  });

  it("should block RFC 1918 Class C private addresses (192.168.0.0/16)", () => {
    expect(isPrivateOrReservedIPv4("192.168.0.1")).toBe(true);
    expect(isPrivateOrReservedIPv4("192.168.1.254")).toBe(true);
  });

  it("should block Link-Local & AWS/GCP Cloud Metadata addresses (169.254.0.0/16)", () => {
    expect(isPrivateOrReservedIPv4("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIPv4("169.254.1.1")).toBe(true);
  });

  it("should block Carrier-Grade NAT (100.64.0.0/10)", () => {
    expect(isPrivateOrReservedIPv4("100.64.0.1")).toBe(true);
    expect(isPrivateOrReservedIPv4("100.100.1.1")).toBe(true);
    expect(isPrivateOrReservedIPv4("100.127.255.255")).toBe(true);
  });

  it("should block 0.0.0.0/8, Multicast (224.0.0.0/4), and Reserved ranges", () => {
    expect(isPrivateOrReservedIPv4("0.0.0.0")).toBe(true);
    expect(isPrivateOrReservedIPv4("224.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIPv4("240.0.0.1")).toBe(true);
  });

  it("should allow legitimate public IPv4 addresses", () => {
    expect(isPrivateOrReservedIPv4("8.8.8.8")).toBe(false); // Google DNS
    expect(isPrivateOrReservedIPv4("1.1.1.1")).toBe(false); // Cloudflare DNS
    expect(isPrivateOrReservedIPv4("140.82.121.4")).toBe(false); // GitHub
  });

  it("should block private/reserved IPv6 addresses", () => {
    expect(isPrivateOrReservedIPv6("::1")).toBe(true); // Loopback
    expect(isPrivateOrReservedIPv6("::")).toBe(true); // Unspecified
    expect(isPrivateOrReservedIPv6("fc00::1")).toBe(true); // Unique local
    expect(isPrivateOrReservedIPv6("fe80::1")).toBe(true); // Link-local
    expect(isPrivateOrReservedIPv6("::ffff:127.0.0.1")).toBe(true); // IPv4-mapped loopback
  });
});

describe("SSRF Guard - Hostname & Resolution Verification", () => {
  it("should throw SSRFSecurityException on localhost and internal hosts", async () => {
    await expect(validateAndResolveTarget("localhost")).rejects.toThrow(SSRFSecurityException);
    await expect(validateAndResolveTarget("127.0.0.1")).rejects.toThrow(SSRFSecurityException);
    await expect(validateAndResolveTarget("server.local")).rejects.toThrow(SSRFSecurityException);
    await expect(validateAndResolveTarget("api.internal")).rejects.toThrow(SSRFSecurityException);
  });

  it("should reject invalid domain syntax", async () => {
    await expect(validateAndResolveTarget("invalid..domain")).rejects.toThrow(SSRFSecurityException);
    await expect(validateAndResolveTarget("")).rejects.toThrow(SSRFSecurityException);
  });

  it("should clean and accept valid public domain names", async () => {
    const result = await validateAndResolveTarget("https://cloudflare.com/path?query=1");
    expect(result.domain).toBe("cloudflare.com");
    expect(result.resolvedIps.length).toBeGreaterThan(0);
    expect(result.safeTargetUrl).toBe("https://cloudflare.com");
  });
});

