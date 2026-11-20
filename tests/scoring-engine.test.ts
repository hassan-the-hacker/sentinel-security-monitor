import { describe, it, expect } from "vitest";
import { computeSecurityGrade, compileCompleteScan } from "@/services/scanner/scoring-engine";

describe("Security Scoring Engine - Grade Calculations", () => {
  it("should assign Grade A+ for scores >= 95", () => {
    expect(computeSecurityGrade(100)).toBe("A+");
    expect(computeSecurityGrade(95)).toBe("A+");
  });

  it("should assign Grade A for scores 85 to 94", () => {
    expect(computeSecurityGrade(94)).toBe("A");
    expect(computeSecurityGrade(85)).toBe("A");
  });

  it("should assign Grade B for scores 70 to 84", () => {
    expect(computeSecurityGrade(84)).toBe("B");
    expect(computeSecurityGrade(70)).toBe("B");
  });

  it("should assign Grade C for scores 55 to 69", () => {
    expect(computeSecurityGrade(69)).toBe("C");
    expect(computeSecurityGrade(55)).toBe("C");
  });

  it("should assign Grade D for scores 40 to 54", () => {
    expect(computeSecurityGrade(54)).toBe("D");
    expect(computeSecurityGrade(40)).toBe("D");
  });

  it("should assign Grade F for scores < 40", () => {
    expect(computeSecurityGrade(39)).toBe("F");
    expect(computeSecurityGrade(0)).toBe("F");
  });
});

describe("Security Scoring Engine - 100-Point Category Compilation", () => {
  it("should calculate perfect 100/100 score when all checks pass with 0 deduction", () => {
    const perfectScan = compileCompleteScan({
      domain: "example.com",
      targetUrl: "https://example.com",
      durationMs: 450,
      sslDetails: {
        valid: true,
        issuer: { organization: "Let's Encrypt" },
        subject: { commonName: "example.com" },
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 80 * 86400000).toISOString(),
        daysRemaining: 80,
        isExpired: false,
        expiresSoon: false,
        protocol: "TLSv1.3",
        authorized: true,
      },
      sslFindings: [],
      headersDetails: [
        {
          header: "Content-Security-Policy",
          name: "CSP",
          present: true,
          value: "default-src 'self'",
          status: "pass",
          severity: "safe",
          scoreImpact: 0,
          description: "Enforced",
          recommendation: "Keep active",
        },
      ],
      headersFindings: [],
      serverDisclosure: {
        serverHeader: null,
        poweredByHeader: null,
        exposesVersion: false,
        detectedTechnologies: [],
        riskLevel: "safe",
      },
      dnsDetails: {
        resolvedIps: ["93.184.216.34"],
        hasIpv6: true,
        hasMx: true,
        spf: { present: true, status: "pass" },
        dmarc: { present: true, policy: "reject", status: "pass" },
        dnssec: { enabled: true, status: "verified", details: "DNSSEC verified" },
        caa: { present: true },
        nameservers: ["a.iana-servers.net"],
      },
      dnsFindings: [],
      httpsConfigDetails: {
        supportsHttps: true,
        httpPortOpen: true,
        httpRedirectsToHttps: true,
        redirectStatusCode: 301,
        finalDestinationUrl: "https://example.com",
        isInsecureDestination: false,
        hstsEnforced: true,
        hstsPreloadEligible: true,
      },
      httpsFindings: [],
    });

    expect(perfectScan.overallScore).toBe(100);
    expect(perfectScan.grade).toBe("A+");
    expect(perfectScan.categories.ssl.score).toBe(25);
    expect(perfectScan.categories.headers.score).toBe(30);
    expect(perfectScan.categories.dns.score).toBe(25);
    expect(perfectScan.categories.https.score).toBe(20);
  });

  it("should never let scores drop below 0 even with excessive deductions", () => {
    const brokenScan = compileCompleteScan({
      domain: "broken.example",
      targetUrl: "http://broken.example",
      durationMs: 300,
      sslDetails: {
        valid: false,
        issuer: {},
        subject: {},
        validFrom: "",
        validTo: "",
        daysRemaining: 0,
        isExpired: true,
        expiresSoon: false,
        protocol: "None",
        authorized: false,
      },
      sslFindings: [
        {
          id: "ssl-exp",
          category: "ssl",
          checkName: "Cert",
          title: "Expired",
          status: "fail",
          severity: "critical",
          scoreImpact: -50, // huge deduction
          description: "Expired",
          recommendation: "Renew",
        },
      ],
      headersDetails: [],
      headersFindings: [
        {
          id: "h-csp",
          category: "headers",
          checkName: "CSP",
          title: "Missing",
          status: "fail",
          severity: "critical",
          scoreImpact: -50,
          description: "Missing",
          recommendation: "Add",
        },
      ],
      serverDisclosure: {
        serverHeader: "Apache/2.2.8 (Ubuntu)",
        poweredByHeader: "PHP/5.2.4",
        exposesVersion: true,
        detectedTechnologies: ["Apache/2.2.8"],
        riskLevel: "medium",
      },
      dnsDetails: {
        resolvedIps: [],
        hasIpv6: false,
        hasMx: false,
        spf: { present: false, status: "fail" },
        dmarc: { present: false, status: "fail" },
        dnssec: { enabled: false, status: "not_configured", details: "None" },
        caa: { present: false },
        nameservers: [],
      },
      dnsFindings: [
        {
          id: "dns-spf",
          category: "dns",
          checkName: "SPF",
          title: "Missing",
          status: "fail",
          severity: "critical",
          scoreImpact: -50,
          description: "Missing",
          recommendation: "Add",
        },
      ],
      httpsConfigDetails: {
        supportsHttps: false,
        httpPortOpen: true,
        httpRedirectsToHttps: false,
        finalDestinationUrl: "http://broken.example",
        isInsecureDestination: true,
        hstsEnforced: false,
        hstsPreloadEligible: false,
      },
      httpsFindings: [
        {
          id: "https-no-redir",
          category: "https",
          checkName: "Redirect",
          title: "No Redirect",
          status: "fail",
          severity: "critical",
          scoreImpact: -50,
          description: "No HTTPS",
          recommendation: "Enforce HTTPS",
        },
      ],
    });

    expect(brokenScan.overallScore).toBe(0);
    expect(brokenScan.grade).toBe("F");
    expect(brokenScan.categories.ssl.score).toBe(0);
    expect(brokenScan.categories.headers.score).toBe(0);
    expect(brokenScan.categories.dns.score).toBe(0);
    expect(brokenScan.categories.https.score).toBe(0);
  });
});

