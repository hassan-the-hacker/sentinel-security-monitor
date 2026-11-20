"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  Server,
  Zap,
  Download,
  RotateCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { CompleteScanResult, Finding, SeverityLevel } from "@/types/scanner";
import { generateSecurityReportPdf } from "@/services/pdf-report-generator";
import { cn } from "@/lib/utils";

export default function ScanResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const scanId = params.id as string;
  const paramDomain = searchParams.get("domain");

  const [scan, setScan] = useState<CompleteScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    // 1. Try to find scan in localStorage
    try {
      const history: CompleteScanResult[] = JSON.parse(
        localStorage.getItem("sentinel_scan_history") || "[]"
      );
      const found = history.find((s) => s.id === scanId || (paramDomain && s.domain === paramDomain));
      if (found) {
        setScan(found);
        setLoading(false);
        return;
      }
    } catch {
      // Ignore
    }

    // 2. If not found in history, but domain is supplied, execute live scan
    if (paramDomain) {
      fetchLiveScan(paramDomain);
    } else {
      setError("No scan report found for the requested ID. Please run a new scan.");
      setLoading(false);
    }
  }, [scanId, paramDomain]);

  const fetchLiveScan = async (domainToScan: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToScan, authorized: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch scan");
      setScan(data);

      // Save to localStorage
      try {
        const history: CompleteScanResult[] = JSON.parse(
          localStorage.getItem("sentinel_scan_history") || "[]"
        );
        localStorage.setItem(
          "sentinel_scan_history",
          JSON.stringify([data, ...history.filter((s) => s.id !== data.id)].slice(0, 50))
        );
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error executing scan");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRemediation = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center cyber-grid">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 animate-pulse">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Loading Security Audit Report</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Gathering cryptographic telemetry and security score metrics...
        </p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center cyber-grid px-4">
        <div className="p-6 rounded-2xl bg-surface-200 border border-red-500/40 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Audit Report Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/scanner">
              <Button variant="primary" size="sm">
                Run New Scan
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredFindings = scan.findings.filter((f) => {
    if (filterSeverity === "all") return true;
    if (filterSeverity === "issues") return f.severity !== "safe" && f.severity !== "info";
    return f.severity === filterSeverity;
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-cyan-400";
    if (score >= 55) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 cyber-grid min-h-[90vh]">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="p-2 rounded-lg bg-surface-100 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
                {scan.domain}
              </h1>
              <Badge grade={scan.grade} dot>
                GRADE {scan.grade}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited on {new Date(scan.scannedAt).toLocaleDateString()} at{" "}
              {new Date(scan.scannedAt).toLocaleTimeString()} • Execution: {scan.durationMs}ms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveScan(scan.domain)}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Re-scan
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => generateSecurityReportPdf(scan)}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* Top Posture Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Overall Score */}
        <Card glow="emerald" className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400">OVERALL SECURITY SCORE</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={cn("text-4xl font-extrabold font-mono", getScoreColor(scan.overallScore))}>
                {scan.overallScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Based on 4 passive threat vectors</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-surface-100 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-2xl text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
            {scan.grade}
          </div>
        </Card>

        {/* SSL Expiration */}
        <Card glow="none" className="p-5">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>SSL CERTIFICATE</span>
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {scan.sslDetails.daysRemaining}
            </span>
            <span className="text-xs text-slate-400">days left</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono truncate">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            {scan.sslDetails.issuer.organization || scan.sslDetails.issuer.commonName || "Valid Certificate"}
          </p>
        </Card>

        {/* Findings Count */}
        <Card glow="none" className="p-5">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>TOTAL ISSUES</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {scan.summary.criticalFindings + scan.summary.highFindings + scan.summary.mediumFindings + scan.summary.lowFindings}
            </span>
            <span className="text-xs text-slate-400">detected</span>
          </div>
          <div className="mt-1 flex gap-1.5 text-[10px] font-mono">
            <span className="text-red-400 font-semibold">{scan.summary.criticalFindings} Crit</span>
            <span className="text-orange-400 font-semibold">{scan.summary.highFindings} High</span>
            <span className="text-amber-400 font-semibold">{scan.summary.mediumFindings} Med</span>
          </div>
        </Card>

        {/* HTTPS Status */}
        <Card glow="none" className="p-5">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>HTTPS ENFORCEMENT</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-400 font-mono">
              {scan.httpsConfigDetails.httpRedirectsToHttps ? "STRICT" : "LENIENT"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
            {scan.httpsConfigDetails.httpRedirectsToHttps
              ? `HTTP 301 -> ${scan.httpsConfigDetails.finalDestinationUrl}`
              : "No strict port 80 redirect"}
          </p>
        </Card>
      </div>

      {/* 4 Categorical Score Breakdown Cards */}
      <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-400" />
        Categorical Security Scores
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* SSL Category */}
        <Card glow="none" className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">SSL / TLS Encryption</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {scan.categories.ssl.score} / {scan.categories.ssl.maxScore}
            </span>
          </div>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
              style={{ width: `${(scan.categories.ssl.score / scan.categories.ssl.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {scan.categories.ssl.summary}
          </p>
          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Protocol: {scan.sslDetails.protocol}</span>
            <span>{scan.sslDetails.valid ? "CA Verified" : "Untrusted"}</span>
          </div>
        </Card>

        {/* Security Headers Category */}
        <Card glow="none" className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Security Headers</span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {scan.categories.headers.score} / {scan.categories.headers.maxScore}
            </span>
          </div>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all"
              style={{ width: `${(scan.categories.headers.score / scan.categories.headers.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {scan.categories.headers.summary}
          </p>
          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Checks Passed: {scan.categories.headers.passedChecks}/{scan.categories.headers.totalChecks}</span>
            <span>Weight: 30%</span>
          </div>
        </Card>

        {/* DNS Category */}
        <Card glow="none" className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">DNS & Email Protection</span>
            <span className="text-xs font-mono font-bold text-purple-400">
              {scan.categories.dns.score} / {scan.categories.dns.maxScore}
            </span>
          </div>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-400 h-full rounded-full transition-all"
              style={{ width: `${(scan.categories.dns.score / scan.categories.dns.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {scan.categories.dns.summary}
          </p>
          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>DMARC: {scan.dnsDetails.dmarc.policy || "None"}</span>
            <span>DNSSEC: {scan.dnsDetails.dnssec.enabled ? "Yes" : "No"}</span>
          </div>
        </Card>

        {/* HTTPS Category */}
        <Card glow="none" className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">HTTPS Routing</span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {scan.categories.https.score} / {scan.categories.https.maxScore}
            </span>
          </div>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{ width: `${(scan.categories.https.score / scan.categories.https.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {scan.categories.https.summary}
          </p>
          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Status: {scan.httpsConfigDetails.redirectStatusCode || "N/A"}</span>
            <span>Weight: 20%</span>
          </div>
        </Card>
      </div>

      {/* Security Headers Inspection Table */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          HTTP Security Header Matrix
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-surface-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-navy-950 font-mono text-slate-400">
                <th className="py-3 px-4">Header</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Observed Value</th>
                <th className="py-3 px-4">Security Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {scan.headersDetails.map((hdr) => (
                <tr key={hdr.header} className="hover:bg-surface-100/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                    {hdr.header}
                  </td>
                  <td className="py-3 px-4">
                    {hdr.present ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 font-mono text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 max-w-xs truncate" title={hdr.value || "None"}>
                    {hdr.value || <span className="text-slate-400 italic">Header not returned</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-sm">
                    {hdr.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copyable Recommended Nginx / Apache Configuration Snippet */}
      <Card glow="none" className="p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 font-mono">
              Recommended Hardened Nginx Configuration
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleCopyRemediation(
                `# Sentinel Hardened Security Headers\nadd_header X-Frame-Options "DENY" always;\nadd_header X-Content-Type-Options "nosniff" always;\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;\nadd_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;\nadd_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;" always;\nserver_tokens off;`
              )
            }
            leftIcon={copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedSnippet ? "Copied to Clipboard!" : "Copy Nginx Config"}
          </Button>
        </div>
        <pre className="p-3.5 rounded-lg bg-navy-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`# Sentinel Hardened Security Headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;" always;
server_tokens off;`}
        </pre>
      </Card>

      {/* Detailed Findings & Actionable Recommendations */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Detailed Findings & Actionable Remediation ({filteredFindings.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setFilterSeverity("all")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filterSeverity === "all"
                  ? "bg-slate-700 text-white font-bold"
                  : "bg-surface-100 text-slate-400 hover:text-white"
              )}
            >
              All ({scan.findings.length})
            </button>
            <button
              onClick={() => setFilterSeverity("issues")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filterSeverity === "issues"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 font-bold"
                  : "bg-surface-100 text-slate-400 hover:text-white"
              )}
            >
              Issues Only
            </button>
            <button
              onClick={() => setFilterSeverity("critical")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filterSeverity === "critical"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 font-bold"
                  : "bg-surface-100 text-slate-400 hover:text-white"
              )}
            >
              Critical ({scan.summary.criticalFindings})
            </button>
            <button
              onClick={() => setFilterSeverity("high")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filterSeverity === "high"
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold"
                  : "bg-surface-100 text-slate-400 hover:text-white"
              )}
            >
              High ({scan.summary.highFindings})
            </button>
            <button
              onClick={() => setFilterSeverity("medium")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filterSeverity === "medium"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                  : "bg-surface-100 text-slate-400 hover:text-white"
              )}
            >
              Medium ({scan.summary.mediumFindings})
            </button>
            <button
              onClick={() => setFilterSeverity("safe")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-colors",
                filterSeverity === "safe"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                  : "bg-surface-100 text-slate-400 hover:text-white"
              )}
            >
              Passed ({scan.summary.totalPassed})
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-4 rounded-xl bg-surface-200 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Badge severity={finding.severity} dot>
                    {finding.severity.toUpperCase()}
                  </Badge>
                  <span className="font-semibold text-slate-200 text-sm">
                    {finding.title}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-400">
                  {finding.scoreImpact < 0 ? (
                    <span className="text-red-400 font-bold">{finding.scoreImpact} pts</span>
                  ) : (
                    <span className="text-emerald-400">No deduction</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {finding.description}
              </p>

              <div className="p-2.5 rounded-lg bg-navy-950/70 border border-slate-800/80 text-xs flex items-start gap-2">
                <span className="text-emerald-400 font-mono font-bold shrink-0">Remediation:</span>
                <span className="text-slate-300">{finding.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

