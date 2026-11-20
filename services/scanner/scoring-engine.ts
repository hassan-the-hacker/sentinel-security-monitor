import {
  CategoryScore,
  CompleteScanResult,
  Finding,
  HTTPSConfigurationInfo,
  SecurityGrade,
  SecurityHeaderCheck,
  SSLCertificateInfo,
  DNSSecurityInfo,
  ServerDisclosureInfo,
} from "@/types/scanner";

export function computeSecurityGrade(score: number): SecurityGrade {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function compileCompleteScan(params: {
  domain: string;
  targetUrl: string;
  durationMs: number;
  sslDetails: SSLCertificateInfo;
  sslFindings: Finding[];
  headersDetails: SecurityHeaderCheck[];
  headersFindings: Finding[];
  serverDisclosure: ServerDisclosureInfo;
  dnsDetails: DNSSecurityInfo;
  dnsFindings: Finding[];
  httpsConfigDetails: HTTPSConfigurationInfo;
  httpsFindings: Finding[];
}): CompleteScanResult {
  const {
    domain,
    targetUrl,
    durationMs,
    sslDetails,
    sslFindings,
    headersDetails,
    headersFindings,
    serverDisclosure,
    dnsDetails,
    dnsFindings,
    httpsConfigDetails,
    httpsFindings,
  } = params;

  // 1. SSL/TLS Score (Max: 25 points)
  let sslScore = 25;
  for (const f of sslFindings) {
    if (f.scoreImpact < 0) {
      sslScore += f.scoreImpact;
    }
  }
  sslScore = Math.max(0, Math.min(25, sslScore));

  const sslCategory: CategoryScore = {
    name: "SSL / TLS Encryption",
    category: "ssl",
    score: sslScore,
    maxScore: 25,
    weightPercentage: 25,
    status: sslScore >= 22 ? "excellent" : sslScore >= 18 ? "good" : sslScore >= 12 ? "fair" : "poor",
    passedChecks: sslFindings.filter((f) => f.status === "pass").length,
    totalChecks: sslFindings.length,
    summary: sslDetails.valid
      ? `Valid TLS certificate (${sslDetails.daysRemaining} days remaining), ${sslDetails.protocol}`
      : `SSL verification failed: ${sslDetails.authorizationError || "Untrusted/Expired"}`,
  };

  // 2. Security Headers Score (Max: 30 points)
  let headersScore = 30;
  for (const f of headersFindings) {
    if (f.scoreImpact < 0) {
      headersScore += f.scoreImpact;
    }
  }
  headersScore = Math.max(0, Math.min(30, headersScore));

  const headersCategory: CategoryScore = {
    name: "HTTP Security Headers",
    category: "headers",
    score: headersScore,
    maxScore: 30,
    weightPercentage: 30,
    status: headersScore >= 25 ? "excellent" : headersScore >= 18 ? "good" : headersScore >= 10 ? "fair" : "poor",
    passedChecks: headersDetails.filter((h) => h.status === "pass").length,
    totalChecks: headersDetails.length,
    summary: `${headersDetails.filter((h) => h.present).length} of ${headersDetails.length} recommended HTTP security headers active`,
  };

  // 3. DNS & Email Hygiene Score (Max: 25 points)
  let dnsScore = 25;
  for (const f of dnsFindings) {
    if (f.scoreImpact < 0) {
      dnsScore += f.scoreImpact;
    }
  }
  dnsScore = Math.max(0, Math.min(25, dnsScore));

  const dnsCategory: CategoryScore = {
    name: "DNS & Email Protection",
    category: "dns",
    score: dnsScore,
    maxScore: 25,
    weightPercentage: 25,
    status: dnsScore >= 20 ? "excellent" : dnsScore >= 15 ? "good" : dnsScore >= 10 ? "fair" : "poor",
    passedChecks: dnsFindings.filter((f) => f.status === "pass").length,
    totalChecks: dnsFindings.length,
    summary: `SPF: ${dnsDetails.spf.present ? "Present" : "Missing"}, DMARC: ${dnsDetails.dmarc.present ? dnsDetails.dmarc.policy : "Missing"}, DNSSEC: ${dnsDetails.dnssec.enabled ? "Active" : "Not enabled"}`,
  };

  // 4. HTTPS Configuration Score (Max: 20 points)
  let httpsScore = 20;
  for (const f of httpsFindings) {
    if (f.scoreImpact < 0) {
      httpsScore += f.scoreImpact;
    }
  }
  httpsScore = Math.max(0, Math.min(20, httpsScore));

  const httpsCategory: CategoryScore = {
    name: "HTTPS Redirection & Routing",
    category: "https",
    score: httpsScore,
    maxScore: 20,
    weightPercentage: 20,
    status: httpsScore >= 18 ? "excellent" : httpsScore >= 14 ? "good" : httpsScore >= 8 ? "fair" : "poor",
    passedChecks: httpsFindings.filter((f) => f.status === "pass").length,
    totalChecks: httpsFindings.length,
    summary: httpsConfigDetails.httpRedirectsToHttps
      ? `Proper HTTP to HTTPS permanent redirection enforced (${httpsConfigDetails.redirectStatusCode})`
      : "Plaintext HTTP redirection not strictly enforced",
  };

  const overallScore = Math.round(sslScore + headersScore + dnsScore + httpsScore);
  const grade = computeSecurityGrade(overallScore);

  const allFindings = [...sslFindings, ...headersFindings, ...dnsFindings, ...httpsFindings];

  const criticalFindings = allFindings.filter((f) => f.severity === "critical").length;
  const highFindings = allFindings.filter((f) => f.severity === "high").length;
  const mediumFindings = allFindings.filter((f) => f.severity === "medium").length;
  const lowFindings = allFindings.filter((f) => f.severity === "low").length;
  const infoFindings = allFindings.filter((f) => f.severity === "info").length;
  const totalPassed = allFindings.filter((f) => f.status === "pass").length;

  return {
    id: "scan_" + Math.random().toString(36).substring(2, 11),
    domain,
    targetUrl,
    scannedAt: new Date().toISOString(),
    durationMs,
    overallScore,
    grade,
    summary: {
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      infoFindings,
      totalPassed,
    },
    categories: {
      ssl: sslCategory,
      headers: headersCategory,
      dns: dnsCategory,
      https: httpsCategory,
    },
    sslDetails,
    headersDetails,
    dnsDetails,
    httpsConfigDetails,
    serverDisclosure,
    findings: allFindings,
  };
}

