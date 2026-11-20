import { CompleteScanResult } from "@/types/scanner";
import { validateAndResolveTarget, SSRFSecurityException } from "./ssrf-guard";
import { analyzeSSLCertificate } from "./ssl-analyzer";
import { analyzeSecurityHeaders } from "./headers-analyzer";
import { analyzeDNSSecurity } from "./dns-analyzer";
import { analyzeHTTPSConfiguration } from "./https-config-analyzer";
import { compileCompleteScan } from "./scoring-engine";

export interface ScanOptions {
  timeoutMs?: number;
}

/**
 * Main Sentinel Scanner Orchestrator.
 * 1. Pre-flight SSRF and DNS check
 * 2. Parallel execution of SSL, Headers, DNS, and HTTPS probes
 * 3. Transparent 100-point scoring engine computation
 */
export async function executeSecurityScan(
  targetInput: string,
  options: ScanOptions = {}
): Promise<CompleteScanResult> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 8000;

  // 1. SSRF and Domain Pre-Flight Gate
  const { domain, safeTargetUrl } = await validateAndResolveTarget(targetInput);

  // 2. Run all passive inspections in parallel using Promise.allSettled
  const [sslResult, headersResult, dnsResult, httpsResult] = await Promise.allSettled([
    analyzeSSLCertificate(domain, timeoutMs),
    analyzeSecurityHeaders(domain, timeoutMs),
    analyzeDNSSecurity(domain),
    analyzeHTTPSConfiguration(domain, timeoutMs),
  ]);

  const durationMs = Date.now() - startTime;

  // Process SSL result
  const sslData =
    sslResult.status === "fulfilled"
      ? sslResult.value
      : {
          sslDetails: {
            valid: false,
            issuer: {},
            subject: {},
            validFrom: "",
            validTo: "",
            daysRemaining: 0,
            isExpired: false,
            expiresSoon: false,
            protocol: "Error",
            authorized: false,
            authorizationError: sslResult.reason?.message || "SSL Check Failure",
          },
          findings: [
            {
              id: "ssl-fail",
              category: "ssl" as const,
              checkName: "TLS Check",
              title: "SSL/TLS Evaluation Failed",
              status: "fail" as const,
              severity: "high" as const,
              scoreImpact: -20,
              description: `SSL audit failed: ${sslResult.reason?.message || "Unknown error"}`,
              recommendation: "Verify TLS configuration on port 443.",
            },
          ],
        };

  // Process Headers result
  const headersData =
    headersResult.status === "fulfilled"
      ? headersResult.value
      : {
          headersDetails: [],
          serverDisclosure: {
            serverHeader: null,
            poweredByHeader: null,
            exposesVersion: false,
            detectedTechnologies: [],
            riskLevel: "info" as const,
          },
          findings: [
            {
              id: "headers-fail",
              category: "headers" as const,
              checkName: "Headers Check",
              title: "Security Headers Evaluation Failed",
              status: "fail" as const,
              severity: "medium" as const,
              scoreImpact: -15,
              description: `Header audit failed: ${headersResult.reason?.message || "Unknown error"}`,
              recommendation: "Ensure web server responds to HTTP requests.",
            },
          ],
        };

  // Process DNS result
  const dnsData =
    dnsResult.status === "fulfilled"
      ? dnsResult.value
      : {
          dnsDetails: {
            resolvedIps: [],
            hasIpv6: false,
            hasMx: false,
            spf: { present: false, status: "fail" as const },
            dmarc: { present: false, status: "fail" as const },
            dnssec: { enabled: false, status: "not_configured" as const, details: "DNS inspection failed" },
            caa: { present: false },
            nameservers: [],
          },
          findings: [
            {
              id: "dns-fail",
              category: "dns" as const,
              checkName: "DNS Query",
              title: "DNS Security Records Query Failed",
              status: "fail" as const,
              severity: "medium" as const,
              scoreImpact: -15,
              description: `DNS query failed: ${dnsResult.reason?.message || "Unknown error"}`,
              recommendation: "Check domain nameserver responsiveness.",
            },
          ],
        };

  // Process HTTPS Config result
  const httpsData =
    httpsResult.status === "fulfilled"
      ? httpsResult.value
      : {
          httpsConfigDetails: {
            supportsHttps: true,
            httpPortOpen: false,
            httpRedirectsToHttps: false,
            finalDestinationUrl: safeTargetUrl,
            isInsecureDestination: false,
            hstsEnforced: false,
            hstsPreloadEligible: false,
          },
          findings: [],
        };

  // 3. Compile full score
  const scanResult = compileCompleteScan({
    domain,
    targetUrl: safeTargetUrl,
    durationMs,
    sslDetails: sslData.sslDetails,
    sslFindings: sslData.findings,
    headersDetails: headersData.headersDetails,
    headersFindings: headersData.findings,
    serverDisclosure: headersData.serverDisclosure,
    dnsDetails: dnsData.dnsDetails,
    dnsFindings: dnsData.findings,
    httpsConfigDetails: httpsData.httpsConfigDetails,
    httpsFindings: httpsData.findings,
  });

  return scanResult;
}

export { SSRFSecurityException };

