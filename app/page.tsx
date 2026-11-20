"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Globe,
  Server,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Cpu,
  Layers,
  Database,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function LandingPage() {
  const router = useRouter();
  const [targetDomain, setTargetDomain] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanDomain = (input: string) => {
    return input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");
  };

  const handleStartScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError("");

    const cleaned = cleanDomain(targetDomain);
    if (!cleaned) {
      setValidationError("Please enter a valid website domain (e.g. example.com).");
      return;
    }

    if (!authorized) {
      setValidationError("You must confirm authorization before initiating a scan.");
      return;
    }

    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!domainRegex.test(cleaned)) {
      setValidationError("Invalid domain format. Enter a domain like 'domain.com' without protocol or path.");
      return;
    }

    setIsSubmitting(true);
    // Navigate to scanner with query param
    router.push(`/scanner?domain=${encodeURIComponent(cleaned)}&authorized=true`);
  };

  const quickScanPresets = ["github.com", "cloudflare.com", "supabase.com", "stripe.com"];

  return (
    <div className="relative min-h-screen cyber-grid pb-20">
      {/* Background radial gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/10 blur-[130px] -z-10 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-cyan-500/10 blur-[150px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 text-center">
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-8 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] animate-pulse-slow">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>PRODUCTION-GRADE CYBERSECURITY RECONNAISSANCE</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">PASSIVE AUDIT ENGINE</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl mx-auto leading-[1.15]">
          Know Your Website&apos;s Security{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
            Before Attackers Do.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Comprehensive, zero-cost cybersecurity health monitoring. Inspect SSL/TLS cipher suites, HTTP security headers, SPF/DMARC records, and HTTPS redirection in seconds.
        </p>

        {/* Quick Scan Input Box */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleStartScan}
            className="p-3 rounded-2xl bg-surface-200/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl transition-all focus-within:border-emerald-500/60 focus-within:shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)]"
          >
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter domain to audit (e.g. yourcompany.com)"
                  value={targetDomain}
                  onChange={(e) => {
                    setTargetDomain(e.target.value);
                    if (validationError) setValidationError("");
                  }}
                  className="w-full bg-navy-950/80 text-slate-100 placeholder:text-slate-500 rounded-xl pl-12 pr-4 py-3.5 text-sm font-mono focus:outline-none border border-slate-800"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shrink-0 py-3.5 px-6 font-semibold"
              >
                Scan Website
              </Button>
            </div>

            {/* Authorization Consent Checkbox */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start gap-2.5 text-left px-2">
              <input
                type="checkbox"
                id="landing-auth-consent"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-navy-950 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-navy-950 cursor-pointer"
              />
              <label
                htmlFor="landing-auth-consent"
                className="text-xs text-slate-400 cursor-pointer select-none leading-tight"
              >
                I confirm that I own or am authorized to conduct passive cybersecurity assessments on this target domain.
              </label>
            </div>

            {validationError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </form>

          {/* Quick Presets */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 font-mono">
            <span className="text-slate-400">Sample targets:</span>
            {quickScanPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setTargetDomain(preset);
                  setAuthorized(true);
                  if (validationError) setValidationError("");
                }}
                className="px-2.5 py-1 rounded-md bg-surface-100 hover:bg-surface-50 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics Ticker */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl bg-surface-200/60 border border-slate-800/80 text-left">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>SSL / TLS POSTURE</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100 font-mono">25 Pts</div>
            <p className="text-[11px] text-slate-400 mt-1">Expiry, SAN, TLS 1.3 & cipher suite</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-200/60 border border-slate-800/80 text-left">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>SECURITY HEADERS</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100 font-mono">30 Pts</div>
            <p className="text-[11px] text-slate-400 mt-1">CSP, HSTS, X-Frame, Referrer & more</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-200/60 border border-slate-800/80 text-left">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>DNS & EMAIL HYGIENE</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100 font-mono">25 Pts</div>
            <p className="text-[11px] text-slate-400 mt-1">SPF, DMARC, DNSSEC, CAA & IPv6</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-200/60 border border-slate-800/80 text-left">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>HTTPS ROUTING</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100 font-mono">20 Pts</div>
            <p className="text-[11px] text-slate-400 mt-1">Port 80 redirect & destination safety</p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section (Inspired by BlackSight, Kyntra, Vulnvision) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center mb-10">
          <Badge variant="solid" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 mb-3 font-mono">
            ENTERPRISE SOC INTERFACE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            Real-Time Security Posture Intelligence
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            Interactive, data-driven security metrics designed for DevOps, security engineers, and compliance teams.
          </p>
        </div>

        {/* Mock/Simulated Dashboard Card Frame */}
        <div className="relative rounded-2xl border border-slate-700/80 bg-navy-950/90 shadow-2xl p-6 overflow-hidden">
          {/* Top header bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-800/80 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">sentinel-console // live-telemetry</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface-100 border border-slate-800 text-emerald-400">
                Target: cloudflare.com
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                GRADE A+ (98/100)
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-surface-100/70 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">SECURITY SCORE</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">98</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "98%" }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-100/70 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">SSL CERTIFICATE</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">82</span>
                <span className="text-xs text-slate-400">days left</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-2 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Valid TLS 1.3
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-100/70 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">TOTAL FINDINGS</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-100 font-mono">1</span>
                <span className="text-xs text-slate-400">issue</span>
              </div>
              <div className="mt-2 flex gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">0 Crit</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">1 Med</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">12 Pass</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-100/70 border border-slate-800">
              <div className="text-xs text-slate-400 font-mono">SSRF DEFENSE</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-bold text-emerald-400 font-mono">RFC 1918</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">
                Pre-flight IP validation active
              </p>
            </div>
          </div>

          {/* Audit Breakdown Rows */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200/80 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">Content-Security-Policy (CSP)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ENFORCED (+10 pts)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200/80 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">Strict-Transport-Security (HSTS) with Preload</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                max-age=31536000 (+8 pts)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200/80 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200">DMARC Reject Policy & Strict SPF Record</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                p=reject (+15 pts)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-200/80 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-slate-200">Server Header Disclosure (server: cloudflare)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                INFO NOTICE (-2 pts)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-28">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 mb-3 font-mono">
            ZERO-DAY PASSIVE AUDIT
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            Engineered for Modern Web Security
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-2xl mx-auto">
            External attack surface visibility without intrusive port scans, credentials, or dangerous payloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card glow="emerald" className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">SSL / TLS Certificate Deep Dive</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cryptographic validation of peer certificates, Subject Alternative Names (SAN), issuer trust chain, key length, cipher suite strength, and expiration telemetry.
            </p>
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>TLS 1.2 & 1.3 Validation</span>
            </div>
          </Card>

          <Card glow="cyan" className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">HTTP Security Header Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Examines Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy against RFC standards.
            </p>
            <div className="text-xs text-cyan-400 font-mono flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready-to-paste Nginx / Apache code</span>
            </div>
          </Card>

          <Card glow="none" className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">DNS & Email Protection Hygiene</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Audits domain TXT records for SPF enforcement, parses DMARC policies for anti-spoofing coverage, checks CAA records, and validates DNSSEC cryptographic authenticity.
            </p>
            <div className="text-xs text-purple-400 font-mono flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Phishing & Spoofing Defense</span>
            </div>
          </Card>

          <Card glow="none" className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">HTTPS Redirection & Routing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Traces plain HTTP port 80 connections to verify proper 301 permanent redirection to HTTPS, identifies insecure intermediaries, and tests for mixed-content leakage.
            </p>
            <div className="text-xs text-blue-400 font-mono flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Man-in-the-Middle (MitM) Prevention</span>
            </div>
          </Card>

          <Card glow="red" className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">SSRF & Injection Defense</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The scanner itself is hardened. Pre-flight DNS resolution blocks all RFC 1918 private IPs, AWS/cloud metadata services, loopbacks, and handles DNS rebinding attacks securely.
            </p>
            <div className="text-xs text-red-400 font-mono flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Hardened Against Malicious Targets</span>
            </div>
          </Card>

          <Card glow="none" className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Exportable PDF Security Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              One-click downloadable executive security audit reports in high-resolution PDF format, complete with scoring breakdowns, vulnerability matrices, and technical remediation roadmaps.
            </p>
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready for SOC2 & Leadership Audits</span>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-28">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 mb-3 font-mono">
            METHODOLOGY
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100">
            How Sentinel Evaluates Your Security
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            A deterministic, 4-stage pipeline that runs in parallel for sub-second execution without tripping web application firewalls (WAF).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="p-6 rounded-xl bg-surface-200 border border-slate-800 space-y-3 relative">
            <div className="text-3xl font-mono font-extrabold text-emerald-400/80">01</div>
            <h4 className="font-semibold text-slate-100 text-base">SSRF Pre-Flight Check</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resolves DNS and verifies target IP addresses against private networks (RFC 1918), carrier-grade NAT, and cloud metadata endpoints before opening connections.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface-200 border border-slate-800 space-y-3 relative">
            <div className="text-3xl font-mono font-extrabold text-cyan-400/80">02</div>
            <h4 className="font-semibold text-slate-100 text-base">Parallel Probes</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Initiates concurrent asynchronous requests: TLS socket handshake for cert inspection, HTTP header fetch with size limits, and DNS record queries for SPF/DMARC.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface-200 border border-slate-800 space-y-3 relative">
            <div className="text-3xl font-mono font-extrabold text-purple-400/80">03</div>
            <h4 className="font-semibold text-slate-100 text-base">100-Point Scoring</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent deduction algorithm allocates 25 pts for SSL, 30 pts for headers, 25 pts for DNS/email, and 20 pts for HTTPS configuration to assign an objective grade.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface-200 border border-slate-800 space-y-3 relative">
            <div className="text-3xl font-mono font-extrabold text-amber-400/80">04</div>
            <h4 className="font-semibold text-slate-100 text-base">Actionable Remediation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Produces copy-paste configuration snippets for Nginx, Apache, Cloudflare, and Next.js alongside instant PDF export capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Stack Architecture Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-28">
        <div className="rounded-2xl border border-slate-800 bg-surface-200/60 p-8">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-slate-100">Zero-Cost, High-Performance Stack</h3>
            <p className="text-xs text-slate-400 mt-2">
              Engineered using 100% free and open-source technologies with zero external paid APIs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center font-mono">
            <div className="p-4 rounded-xl bg-surface-100 border border-slate-800/80">
              <Cpu className="w-5 h-5 mx-auto text-emerald-400 mb-2" />
              <div className="text-xs font-bold text-slate-200">Next.js 14</div>
              <div className="text-[10px] text-slate-400 mt-0.5">App Router</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-100 border border-slate-800/80">
              <Terminal className="w-5 h-5 mx-auto text-cyan-400 mb-2" />
              <div className="text-xs font-bold text-slate-200">TypeScript</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Strict Types</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-100 border border-slate-800/80">
              <Database className="w-5 h-5 mx-auto text-emerald-400 mb-2" />
              <div className="text-xs font-bold text-slate-200">Supabase</div>
              <div className="text-[10px] text-slate-400 mt-0.5">PostgreSQL & RLS</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-100 border border-slate-800/80">
              <Layers className="w-5 h-5 mx-auto text-purple-400 mb-2" />
              <div className="text-xs font-bold text-slate-200">Tailwind CSS</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Cyber Theme</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-100 border border-slate-800/80">
              <Lock className="w-5 h-5 mx-auto text-amber-400 mb-2" />
              <div className="text-xs font-bold text-slate-200">Node TLS/DNS</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Native Probes</div>
            </div>

            <div className="p-4 rounded-xl bg-surface-100 border border-slate-800/80">
              <Zap className="w-5 h-5 mx-auto text-blue-400 mb-2" />
              <div className="text-xs font-bold text-slate-200">Vercel</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Edge & Serverless</div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-28 text-center">
        <div className="p-10 rounded-2xl bg-gradient-to-b from-surface-100 to-surface-200 border border-emerald-500/30 shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)]">
          <h2 className="text-3xl font-bold text-slate-100">Ready to audit your web infrastructure?</h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            Run your first passive assessment now. No credit card, no complex agent installation, and zero cost.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/scanner">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Security Scanner
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                View SOC Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

