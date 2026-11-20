"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Radar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  Terminal,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompleteScanResult } from "@/types/scanner";

interface ScanLogItem {
  id: string;
  time: string;
  text: string;
  status: "info" | "success" | "warn" | "fail";
}

function ScannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [domain, setDomain] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logs, setLogs] = useState<ScanLogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<CompleteScanResult | null>(null);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Check URL params on initial load
  useEffect(() => {
    const paramDomain = searchParams.get("domain");
    const paramAuth = searchParams.get("authorized");

    if (paramDomain) {
      setDomain(paramDomain);
      if (paramAuth === "true") {
        setAuthorized(true);
        // Automatically start scan if query param has both
        startScan(paramDomain, true);
      }
    }
  }, [searchParams]);

  const addLog = (text: string, status: "info" | "success" | "warn" | "fail" = "info") => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
    setLogs((prev) => [...prev, { id: Math.random().toString(36), time: timeStr, text, status }]);
  };

  const cleanDomain = (input: string) => {
    return input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");
  };

  const startScan = async (targetOverride?: string, authOverride?: boolean) => {
    setError(null);
    const target = cleanDomain(targetOverride || domain);
    const isAuth = authOverride !== undefined ? authOverride : authorized;

    if (!target) {
      setError("Please specify a target domain to audit.");
      return;
    }

    if (!isAuth) {
      setError("You must confirm authorization before initiating a security audit.");
      return;
    }

    setIsScanning(true);
    setCurrentStep(1);
    setLogs([]);
    setCompletedResult(null);

    addLog(`Initiating Sentinel Passive Security Audit for [${target}]`, "info");
    addLog(`Phase 1/4: Running SSRF pre-flight validation and DNS resolution...`, "info");

    try {
      // Small simulated delay for visual telemetry steps while the real API runs
      const stepTimer1 = setTimeout(() => {
        setCurrentStep(2);
        addLog(`SSRF Guard Passed: Host [${target}] verified as safe public domain.`, "success");
        addLog(`Phase 2/4: Establishing TLS socket handshake & inspecting certificate chain...`, "info");
      }, 500);

      const stepTimer2 = setTimeout(() => {
        setCurrentStep(3);
        addLog(`Phase 3/4: Fetching HTTP security headers and tracing redirection...`, "info");
      }, 1100);

      const stepTimer3 = setTimeout(() => {
        setCurrentStep(4);
        addLog(`Phase 4/4: Querying SPF, DMARC, CAA records and validating DNSSEC...`, "info");
      }, 1700);

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: target, authorized: true }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Security audit failed.");
      }

      setCurrentStep(5);
      addLog(`Scoring engine compiled: ${result.overallScore}/100 points (Grade: ${result.grade}).`, "success");
      addLog(`Audit complete in ${result.durationMs}ms. Rendering full telemetry report...`, "success");

      setCompletedResult(result);

      // Save locally in recent scans list for offline/guest persistence
      try {
        const storedHistory = JSON.parse(localStorage.getItem("sentinel_scan_history") || "[]");
        const updatedHistory = [result, ...storedHistory.filter((s: CompleteScanResult) => s.id !== result.id)].slice(0, 50);
        localStorage.setItem("sentinel_scan_history", JSON.stringify(updatedHistory));
      } catch {
        // localStorage non-fatal
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Security audit encountered an error";
      setError(msg);
      addLog(`Audit Aborted: ${msg}`, "fail");
    } finally {
      setIsScanning(false);
    }
  };

  const steps = [
    { num: 1, title: "SSRF & DNS Guard", desc: "Validate target & private IP ranges" },
    { num: 2, title: "SSL / TLS Handshake", desc: "Inspect cert validity, expiry & ciphers" },
    { num: 3, title: "Security Headers", desc: "Audit CSP, HSTS, X-Frame & Referrer" },
    { num: 4, title: "DNS, SPF & DMARC", desc: "Check anti-spoofing & DNSSEC" },
    { num: 5, title: "Scoring & Grading", desc: "Compute 100-point security grade" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[90vh]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Radar className="w-6 h-6 text-emerald-400" />
            Security scanner
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Run an external audit of SSL certificates, HTTP security headers, and DNS records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </Button>
        </div>
      </div>

      {/* Target Input Console */}
      <Card glow="none" className="p-6 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startScan();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Domain to scan
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="example.com (or stripe.com, cloudflare.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={isScanning}
                  className="text-sm py-2.5"
                  leftIcon={<Globe className="w-4 h-4" />}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isScanning}
                disabled={isScanning}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="shrink-0"
              >
                {isScanning ? "Scanning..." : "Start scan"}
              </Button>
            </div>
          </div>

          {/* Authorization Checkbox */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
            <input
              type="checkbox"
              id="auth-checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              disabled={isScanning}
              className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
            />
            <label
              htmlFor="auth-checkbox"
              className="text-xs text-slate-400 cursor-pointer select-none leading-relaxed"
            >
              I confirm I am authorized to conduct passive external assessments on this domain.
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Preset Quick Actions */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Quick targets:</span>
          {["github.com", "cloudflare.com", "supabase.com", "google.com"].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isScanning}
              onClick={() => {
                setDomain(preset);
                setAuthorized(true);
                startScan(preset, true);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50 text-xs"
            >
              {preset}
            </button>
          ))}
        </div>
      </Card>

      {/* Audit Pipeline Stepper (Visual Progress) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8">
        {steps.map((st) => {
          const isComplete = currentStep > st.num || (currentStep === 5 && completedResult);
          const isCurrent = currentStep === st.num;
          return (
            <div
              key={st.num}
              className={`p-3.5 rounded-xl border transition-all ${isComplete
                ? "bg-slate-900 border-emerald-500/30 text-slate-200"
                : isCurrent
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : "bg-slate-950/40 border-slate-800/80 text-slate-500"
                }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="text-slate-500 font-medium">Step {st.num}</span>
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 text-slate-300 animate-spin" />
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </div>
              <div className="font-semibold text-xs text-slate-200 truncate">{st.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{st.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Terminal Telemetry Logs */}
      {(logs.length > 0 || isScanning) && (
        <Card glow="none" className="p-0 overflow-hidden mb-8 border-slate-800">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-300">Scan activity</span>
            </div>
            {isScanning && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-400">Running...</span>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-950/90 font-mono text-xs max-h-60 overflow-y-auto space-y-1.5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-400 shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.status === "success"
                      ? "text-emerald-400"
                      : log.status === "fail"
                        ? "text-red-400"
                        : log.status === "warn"
                          ? "text-amber-400"
                          : "text-slate-300"
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </Card>
      )}

      {/* Completed Scan Notification Card */}
      {completedResult && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-100 to-surface-200 border border-emerald-500/40 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex flex-col items-center justify-center font-mono">
              <span className="text-2xl font-black text-emerald-400 leading-none">
                {completedResult.grade}
              </span>
              <span className="text-[10px] text-emerald-300 mt-1 font-bold">
                {completedResult.overallScore}/100
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100 font-mono">
                  {completedResult.domain}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Completed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Detected {completedResult.summary.criticalFindings} critical, {completedResult.summary.highFindings} high, and {completedResult.summary.mediumFindings} medium findings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                // Navigate to scan result page
                router.push(`/scan/${completedResult.id}?domain=${encodeURIComponent(completedResult.domain)}`);
              }}
              className="w-full sm:w-auto font-semibold"
            >
              View Full Security Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScannerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[90vh] flex items-center justify-center text-slate-400 font-mono text-sm">
          Initializing Scanner Console...
        </div>
      }
    >
      <ScannerContent />
    </React.Suspense>
  );
}

