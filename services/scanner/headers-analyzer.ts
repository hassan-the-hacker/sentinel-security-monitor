import https from "https";
import http from "http";
import { URL } from "url";
import { SecurityHeaderCheck, ServerDisclosureInfo, Finding } from "@/types/scanner";
import { validateAndResolveTarget } from "./ssrf-guard";

export interface HeaderAnalysisResult {
  headersDetails: SecurityHeaderCheck[];
  serverDisclosure: ServerDisclosureInfo;
  findings: Finding[];
}

export async function analyzeSecurityHeaders(
  domain: string,
  timeoutMs = 7000
): Promise<HeaderAnalysisResult> {
  const targetUrl = `https://${domain}`;
  const findings: Finding[] = [];

  let rawHeaders: Record<string, string> = {};

  try {
    rawHeaders = await fetchHeadersWithSsrfCheck(targetUrl, timeoutMs);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Header fetch failed";
    return {
      headersDetails: [],
      serverDisclosure: {
        serverHeader: null,
        poweredByHeader: null,
        exposesVersion: false,
        detectedTechnologies: [],
        riskLevel: "info",
      },
      findings: [
        {
          id: "hdr-fetch-fail",
          category: "headers",
          checkName: "HTTP Connection",
          title: "Failed to Fetch HTTP Headers",
          status: "fail",
          severity: "high",
          scoreImpact: -20,
          description: `Unable to retrieve headers from ${targetUrl}: ${errorMsg}`,
          recommendation: "Ensure web server responds properly to HTTPS HEAD/GET requests.",
        },
      ],
    };
  }

  // 1. Content-Security-Policy
  const csp = rawHeaders["content-security-policy"] || null;
  const cspCheck: SecurityHeaderCheck = {
    header: "Content-Security-Policy",
    name: "CSP Policy",
    present: Boolean(csp),
    value: csp,
    status: csp ? "pass" : "fail",
    severity: csp ? "safe" : "high",
    scoreImpact: csp ? 0 : -10,
    description: csp
      ? "Content-Security-Policy is active, mitigating XSS, code injection, and unauthorized data exfiltration."
      : "Missing Content-Security-Policy header. Your site is at higher risk of Cross-Site Scripting (XSS) and clickjacking.",
    recommendation:
      "Configure Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;",
    rfcReference: "W3C CSP Level 3",
  };

  findings.push({
    id: "hdr-csp",
    category: "headers",
    checkName: "Content-Security-Policy",
    title: csp ? "Content-Security-Policy Enforced" : "Missing Content-Security-Policy (CSP)",
    status: csp ? "pass" : "fail",
    severity: csp ? "safe" : "high",
    scoreImpact: csp ? 0 : -10,
    description: cspCheck.description,
    recommendation: cspCheck.recommendation,
    rawDetails: { value: csp },
  });

  // 2. Strict-Transport-Security (HSTS)
  const hsts = rawHeaders["strict-transport-security"] || null;
  const hstsHasMaxAge = hsts && /max-age=\d+/i.test(hsts);
  const hstsLongAge = hsts && /max-age=([1-9]\d{6,})/i.test(hsts); // >= 1,000,000 seconds
  const hstsCheck: SecurityHeaderCheck = {
    header: "Strict-Transport-Security",
    name: "HSTS Enforcement",
    present: Boolean(hsts),
    value: hsts,
    status: hsts && hstsHasMaxAge ? "pass" : "fail",
    severity: hsts && hstsHasMaxAge ? "safe" : "high",
    scoreImpact: hsts && hstsHasMaxAge ? 0 : -8,
    description: hsts
      ? `Strict-Transport-Security enforced (${hsts}). Protects against SSL stripping and cookie hijacking.`
      : "Missing Strict-Transport-Security header. Browsers may connect over unencrypted HTTP before redirecting.",
    recommendation:
      "Configure Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
    rfcReference: "RFC 6797",
  };

  findings.push({
    id: "hdr-hsts",
    category: "headers",
    checkName: "Strict-Transport-Security",
    title: hsts ? "Strict-Transport-Security Active" : "Missing Strict-Transport-Security (HSTS)",
    status: hsts ? "pass" : "fail",
    severity: hsts ? "safe" : "high",
    scoreImpact: hstsCheck.scoreImpact,
    description: hstsCheck.description,
    recommendation: hstsCheck.recommendation,
    rawDetails: { value: hsts, isLongAge: hstsLongAge },
  });

  // 3. X-Content-Type-Options
  const xcto = rawHeaders["x-content-type-options"] || null;
  const xctoValid = xcto && xcto.toLowerCase().trim() === "nosniff";
  const xctoCheck: SecurityHeaderCheck = {
    header: "X-Content-Type-Options",
    name: "MIME-Type Sniffing Protection",
    present: Boolean(xcto),
    value: xcto,
    status: xctoValid ? "pass" : "fail",
    severity: xctoValid ? "safe" : "medium",
    scoreImpact: xctoValid ? 0 : -4,
    description: xctoValid
      ? "X-Content-Type-Options: nosniff blocks MIME confusion and malicious script execution disguised as images or text."
      : "Missing or incorrect X-Content-Type-Options header. Browsers may sniff responses into executable MIME types.",
    recommendation: "Configure X-Content-Type-Options: nosniff",
    rfcReference: "Fetch Spec / MDN",
  };

  findings.push({
    id: "hdr-xcto",
    category: "headers",
    checkName: "X-Content-Type-Options",
    title: xctoValid ? "MIME Sniffing Blocked (nosniff)" : "Missing X-Content-Type-Options",
    status: xctoValid ? "pass" : "fail",
    severity: xctoValid ? "safe" : "medium",
    scoreImpact: xctoCheck.scoreImpact,
    description: xctoCheck.description,
    recommendation: xctoCheck.recommendation,
    rawDetails: { value: xcto },
  });

  // 4. X-Frame-Options
  const xfo = rawHeaders["x-frame-options"] || null;
  const xfoValid = xfo && ["deny", "sameorigin"].includes(xfo.toLowerCase().trim());
  const xfoCheck: SecurityHeaderCheck = {
    header: "X-Frame-Options",
    name: "Clickjacking Protection",
    present: Boolean(xfo),
    value: xfo,
    status: xfoValid ? "pass" : "warning",
    severity: xfoValid ? "safe" : "medium",
    scoreImpact: xfoValid ? 0 : -3,
    description: xfoValid
      ? `X-Frame-Options: ${xfo} shields your web application against UI redress and clickjacking attacks.`
      : "Missing X-Frame-Options. If CSP frame-ancestors is also absent, malicious sites can embed your pages in an iframe.",
    recommendation: "Configure X-Frame-Options: DENY or SAMEORIGIN",
    rfcReference: "RFC 7034",
  };

  findings.push({
    id: "hdr-xfo",
    category: "headers",
    checkName: "X-Frame-Options",
    title: xfoValid ? `Clickjacking Protection (${xfo})` : "Missing X-Frame-Options",
    status: xfoValid ? "pass" : "warning",
    severity: xfoValid ? "safe" : "medium",
    scoreImpact: xfoCheck.scoreImpact,
    description: xfoCheck.description,
    recommendation: xfoCheck.recommendation,
    rawDetails: { value: xfo },
  });

  // 5. Referrer-Policy
  const rp = rawHeaders["referrer-policy"] || null;
  const rpCheck: SecurityHeaderCheck = {
    header: "Referrer-Policy",
    name: "Referrer Information Control",
    present: Boolean(rp),
    value: rp,
    status: rp ? "pass" : "warning",
    severity: rp ? "safe" : "low",
    scoreImpact: rp ? 0 : -3,
    description: rp
      ? `Referrer-Policy: ${rp} prevents leaking sensitive session tokens or internal URL parameters in the Referer header.`
      : "Missing Referrer-Policy. Default browser referrer behavior may leak full target URLs to external domains.",
    recommendation: "Configure Referrer-Policy: strict-origin-when-cross-origin or no-referrer",
    rfcReference: "W3C Referrer Policy",
  };

  findings.push({
    id: "hdr-rp",
    category: "headers",
    checkName: "Referrer-Policy",
    title: rp ? `Referrer-Policy Configured (${rp})` : "Missing Referrer-Policy",
    status: rp ? "pass" : "warning",
    severity: rp ? "safe" : "low",
    scoreImpact: rpCheck.scoreImpact,
    description: rpCheck.description,
    recommendation: rpCheck.recommendation,
    rawDetails: { value: rp },
  });

  // 6. Permissions-Policy
  const pp = rawHeaders["permissions-policy"] || null;
  const ppCheck: SecurityHeaderCheck = {
    header: "Permissions-Policy",
    name: "Browser Feature Permissions",
    present: Boolean(pp),
    value: pp,
    status: pp ? "pass" : "warning",
    severity: pp ? "safe" : "low",
    scoreImpact: pp ? 0 : -2,
    description: pp
      ? `Permissions-Policy restricts browser hardware API access (camera, microphone, geolocation).`
      : "Missing Permissions-Policy. Explicitly restrict unused browser APIs to reduce attack surface.",
    recommendation: "Configure Permissions-Policy: camera=(), microphone=(), geolocation=()",
    rfcReference: "W3C Permissions Policy",
  };

  findings.push({
    id: "hdr-pp",
    category: "headers",
    checkName: "Permissions-Policy",
    title: pp ? "Permissions-Policy Restricting APIs" : "Missing Permissions-Policy",
    status: pp ? "pass" : "warning",
    severity: pp ? "safe" : "low",
    scoreImpact: ppCheck.scoreImpact,
    description: ppCheck.description,
    recommendation: ppCheck.recommendation,
    rawDetails: { value: pp },
  });

  // 7. Server & X-Powered-By Information Disclosure
  const serverHeader = rawHeaders["server"] || null;
  const poweredByHeader = rawHeaders["x-powered-by"] || null;
  const detectedTech: string[] = [];

  if (serverHeader) detectedTech.push(`Server: ${serverHeader}`);
  if (poweredByHeader) detectedTech.push(`Powered-By: ${poweredByHeader}`);

  const hasVersionRegex = /\d+\.\d+/;
  const exposesVersion = Boolean(
    (serverHeader && hasVersionRegex.test(serverHeader)) ||
    (poweredByHeader && hasVersionRegex.test(poweredByHeader))
  );

  let disclosureRisk: "critical" | "high" | "medium" | "low" | "info" | "safe" = "safe";
  let disclosureImpact = 0;

  if (exposesVersion) {
    disclosureRisk = "medium";
    disclosureImpact = -4;
    findings.push({
      id: "srv-version-leak",
      category: "server",
      checkName: "Software Version Disclosure",
      title: "Server Banner Exposes Exact Software Version",
      status: "fail",
      severity: "medium",
      scoreImpact: disclosureImpact,
      description: `Public header leaks software release: ${detectedTech.join(", ")}. Attackers use version numbers to target known CVE vulnerabilities.`,
      recommendation: "Disable server signature tokens in Nginx (server_tokens off) or Apache (ServerTokens Prod).",
      rawDetails: { serverHeader, poweredByHeader },
    });
  } else if (poweredByHeader) {
    disclosureRisk = "low";
    disclosureImpact = -2;
    findings.push({
      id: "srv-poweredby-leak",
      category: "server",
      checkName: "X-Powered-By Header",
      title: "Technology Stack Disclosed via X-Powered-By",
      status: "warning",
      severity: "low",
      scoreImpact: disclosureImpact,
      description: `Revealing backend framework (${poweredByHeader}) aids reconnaissance.`,
      recommendation: "Remove X-Powered-By header (e.g. app.disable('x-powered-by') in Express / Next.js poweredByHeader: false).",
      rawDetails: { poweredByHeader },
    });
  } else {
    findings.push({
      id: "srv-clean",
      category: "server",
      checkName: "Server Banner",
      title: "No Granular Version Disclosure Detected",
      status: "pass",
      severity: "safe",
      scoreImpact: 0,
      description: "No vulnerable version signatures or runtime leakages were detected in HTTP response headers.",
      recommendation: "Maintain minimal server header disclosures across all endpoints.",
    });
  }

  const serverDisclosure: ServerDisclosureInfo = {
    serverHeader,
    poweredByHeader,
    exposesVersion,
    detectedTechnologies: detectedTech,
    riskLevel: disclosureRisk,
  };

  return {
    headersDetails: [cspCheck, hstsCheck, xctoCheck, xfoCheck, rpCheck, ppCheck],
    serverDisclosure,
    findings,
  };
}

/**
 * Performs safe HTTPS request with strict SSRF pre-flight and redirect inspection.
 */
async function fetchHeadersWithSsrfCheck(
  targetUrl: string,
  timeoutMs: number,
  redirectCount = 0,
  maxRedirects = 5
): Promise<Record<string, string>> {
  if (redirectCount > maxRedirects) {
    throw new Error("Exceeded maximum redirect limit (5 hops).");
  }

  const parsedUrl = new URL(targetUrl);
  // Re-verify every redirect destination against SSRF
  await validateAndResolveTarget(parsedUrl.hostname);

  return new Promise((resolve, reject) => {
    const isHttps = parsedUrl.protocol === "https:";
    const client = isHttps ? https : http;

    const req = client.request(
      targetUrl,
      {
        method: "HEAD",
        timeout: timeoutMs,
        headers: {
          "User-Agent": "Sentinel-Security-Auditor/1.0 (+https://sentinel.sec/bot)",
          "Accept": "text/html,application/xhtml+xml,*/*",
        },
      },
      (res) => {
        // Handle Redirects safely
        if (
          res.statusCode &&
          [301, 302, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          const nextUrl = new URL(res.headers.location, targetUrl).toString();
          req.destroy();
          resolve(fetchHeadersWithSsrfCheck(nextUrl, timeoutMs, redirectCount + 1, maxRedirects));
          return;
        }

        const normalizedHeaders: Record<string, string> = {};
        for (const [key, val] of Object.entries(res.headers)) {
          if (typeof val === "string") {
            normalizedHeaders[key.toLowerCase()] = val;
          } else if (Array.isArray(val)) {
            normalizedHeaders[key.toLowerCase()] = val.join(", ");
          }
        }
        req.destroy();
        resolve(normalizedHeaders);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

