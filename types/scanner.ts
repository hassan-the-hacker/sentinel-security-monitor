export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info" | "safe";

export type SecurityGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export type ScanCategory = "ssl" | "headers" | "dns" | "https" | "server";

export interface Finding {
  id: string;
  category: ScanCategory;
  checkName: string;
  title: string;
  status: "pass" | "fail" | "warning" | "info";
  severity: SeverityLevel;
  scoreImpact: number; // Deducted points (negative or 0)
  description: string;
  recommendation: string;
  rawDetails?: Record<string, unknown> | string | null;
}

export interface CategoryScore {
  name: string;
  category: ScanCategory;
  score: number;
  maxScore: number;
  weightPercentage: number;
  status: "excellent" | "good" | "fair" | "poor";
  passedChecks: number;
  totalChecks: number;
  summary: string;
}

export interface SSLCertificateInfo {
  valid: boolean;
  issuer: {
    commonName?: string;
    organization?: string;
    country?: string;
  };
  subject: {
    commonName?: string;
    altNames?: string[];
  };
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  expiresSoon: boolean; // < 30 days
  protocol: string;
  cipherSuite?: string;
  keyBits?: number;
  authorized: boolean;
  authorizationError?: string | null;
}

export interface SecurityHeaderCheck {
  header: string;
  name: string;
  present: boolean;
  value: string | null;
  status: "pass" | "fail" | "warning";
  severity: SeverityLevel;
  scoreImpact: number;
  description: string;
  recommendation: string;
  rfcReference?: string;
}

export interface DNSSecurityInfo {
  resolvedIps: string[];
  hasIpv6: boolean;
  hasMx: boolean;
  spf: {
    present: boolean;
    rawRecord?: string | null;
    status: "pass" | "fail" | "warning";
    qualifier?: string;
  };
  dmarc: {
    present: boolean;
    rawRecord?: string | null;
    policy?: "reject" | "quarantine" | "none" | "unknown";
    status: "pass" | "fail" | "warning";
  };
  dnssec: {
    enabled: boolean;
    status: "verified" | "not_configured" | "indeterminate";
    details: string;
  };
  caa: {
    present: boolean;
    records?: string[];
  };
  nameservers: string[];
}

export interface HTTPSConfigurationInfo {
  supportsHttps: boolean;
  httpPortOpen: boolean;
  httpRedirectsToHttps: boolean;
  redirectStatusCode?: number;
  finalDestinationUrl: string;
  isInsecureDestination: boolean;
  hstsEnforced: boolean;
  hstsPreloadEligible: boolean;
}

export interface ServerDisclosureInfo {
  serverHeader: string | null;
  poweredByHeader: string | null;
  exposesVersion: boolean;
  detectedTechnologies: string[];
  riskLevel: SeverityLevel;
}

export interface CompleteScanResult {
  id: string;
  domain: string;
  targetUrl: string;
  scannedAt: string;
  durationMs: number;
  overallScore: number; // 0 - 100
  grade: SecurityGrade;
  summary: {
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    infoFindings: number;
    totalPassed: number;
  };
  categories: {
    ssl: CategoryScore;
    headers: CategoryScore;
    dns: CategoryScore;
    https: CategoryScore;
  };
  sslDetails: SSLCertificateInfo;
  headersDetails: SecurityHeaderCheck[];
  dnsDetails: DNSSecurityInfo;
  httpsConfigDetails: HTTPSConfigurationInfo;
  serverDisclosure: ServerDisclosureInfo;
  findings: Finding[];
}

