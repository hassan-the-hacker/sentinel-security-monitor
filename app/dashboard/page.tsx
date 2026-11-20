"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Globe,
  Zap,
  Radar,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  RotateCw,
  ExternalLink,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompleteScanResult } from "@/types/scanner";
import { formatTimeAgo, cn } from "@/lib/utils";
import { generateSecurityReportPdf } from "@/services/pdf-report-generator";

export default function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<CompleteScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickScanDomain, setQuickScanDomain] = useState("");
  const [quickScanAuth, setQuickScanAuth] = useState(false);
  const [quickScanError, setQuickScanError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = () => {
    try {
      const historyStr = localStorage.getItem("sentinel_scan_history");
      if (historyStr) {
        const parsed = JSON.parse(historyStr);
        setScans(parsed);
      } else {
        setScans([]);
      }
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickScanError("");

    const cleaned = quickScanDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");

    if (!cleaned) {
      setQuickScanError("Please enter a domain name.");
      return;
    }

    if (!quickScanAuth) {
      setQuickScanError("You must confirm authorization before scanning.");
      return;
    }

    setIsScanning(true);
    router.push(`/scanner?domain=${encodeURIComponent(cleaned)}&authorized=true`);
  };

  const handleDeleteScan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this scan record?")) {
      const updated = scans.filter((s) => s.id !== id);
      setScans(updated);
      localStorage.setItem("sentinel_scan_history", JSON.stringify(updated));
    }
  };

  // Compute live statistics from REAL records
  const totalScans = scans.length;
  const uniqueDomains = new Set(scans.map((s) => s.domain)).size;
  const avgScore = totalScans > 0 ? Math.round(scans.reduce((acc, s) => acc + s.overallScore, 0) / totalScans) : 0;
  const totalCritical = scans.reduce((acc, s) => acc + (s.summary?.criticalFindings || 0), 0);
  const totalHigh = scans.reduce((acc, s) => acc + (s.summary?.highFindings || 0), 0);
  const totalMedium = scans.reduce((acc, s) => acc + (s.summary?.mediumFindings || 0), 0);
  const totalLow = scans.reduce((acc, s) => acc + (s.summary?.lowFindings || 0), 0);

  // Prepare chart data from real records
  const scoreTrendData = scans
    .slice()
    .reverse()
    .map((s, idx) => ({
      name: s.domain,
      score: s.overallScore,
      index: idx + 1,
      date: new Date(s.scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

  const issueDistributionData = [
    { name: "Critical", value: totalCritical, color: "#ef4444" },
    { name: "High", value: totalHigh, color: "#f97316" },
    { name: "Medium", value: totalMedium, color: "#eab308" },
    { name: "Low", value: totalLow, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 cyber-grid min-h-[90vh]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 mb-8 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              Security Operations Dashboard
            </h1>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono text-xs">
              LIVE SOC
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time security telemetry, threat distribution, and external health posture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/scanner">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              className="font-semibold"
            >
              Launch Website Scan
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card glow="none" className="p-5">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>TOTAL SCANS RUN</span>
            <Radar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {totalScans}
            </span>
            <span className="text-xs text-slate-400">audits</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Stored security assessments</p>
        </Card>

        <Card glow="none" className="p-5">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>AVERAGE SECURITY SCORE</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {totalScans > 0 ? avgScore : "—"}
            </span>
            {totalScans > 0 && <span className="text-xs text-slate-400">/ 100</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalScans > 0 ? `Across ${uniqueDomains} monitored targets` : "Awaiting first scan"}
          </p>
        </Card>

        <Card glow="none" className="p-5">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>DOMAINS MONITORED</span>
            <Globe className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono">
              {uniqueDomains}
            </span>
            <span className="text-xs text-slate-400">distinct</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Authorized targets</p>
        </Card>

        <Card glow="red" className="p-5">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>CRITICAL FINDINGS</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-400 font-mono">
              {totalCritical}
            </span>
            <span className="text-xs text-slate-400">critical</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalHigh} high, {totalMedium} medium risks
          </p>
        </Card>
      </div>

      {/* Charts & Visual Analytics Section */}
      {totalScans > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Security Score Progression Chart (Recharts) */}
          <Card glow="none" className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Security Score Progression
              </h3>
              <span className="text-xs text-slate-400 font-mono">Latest Targets</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1320",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Issue Severity Distribution (PieChart) */}
          <Card glow="none" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Severity Breakdown
              </h3>
            </div>
            <div className="h-44 w-full flex items-center justify-center">
              {issueDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {issueDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0d1320",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#f1f5f9",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-1 opacity-70" />
                  <span>No security issues found</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Critical: {totalCritical}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>High: {totalHigh}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Medium: {totalMedium}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Low: {totalLow}</span>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Quick Scan Launcher Card */}
      <Card glow="none" className="p-6 mb-8">
        <h3 className="text-sm font-semibold text-slate-200 font-mono mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          Quick Scan Launcher
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Execute a non-invasive passive security inspection on any authorized target domain.
        </p>

        <form onSubmit={handleQuickScan} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. github.com, cloudflare.com, yourcompany.com"
              value={quickScanDomain}
              onChange={(e) => setQuickScanDomain(e.target.value)}
              className="flex-1 bg-navy-950 text-slate-100 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-xs font-mono border border-slate-700 focus:outline-none focus:border-emerald-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isScanning}
              className="font-semibold shrink-0"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Scan Target
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dash-auth"
              checked={quickScanAuth}
              onChange={(e) => setQuickScanAuth(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-surface-200 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
            />
            <label htmlFor="dash-auth" className="text-[11px] text-slate-400 cursor-pointer select-none">
              I confirm I am authorized to conduct passive external assessments on this domain.
            </label>
          </div>

          {quickScanError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {quickScanError}
            </p>
          )}
        </form>
      </Card>

      {/* Recent Scans Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-emerald-400" />
            Recent Security Assessments ({scans.length})
          </h2>
          {scans.length > 0 && (
            <Link
              href="/history"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {scans.length === 0 ? (
          <div className="p-12 rounded-xl bg-surface-200 border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Radar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No Scans Performed Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Your security assessment console is currently empty. Run your first non-invasive domain audit to generate security telemetry, grades, and compliance reports.
            </p>
            <div className="pt-2">
              <Link href="/scanner">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Run First Website Audit
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-surface-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-navy-950 font-mono text-slate-400">
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Scanned</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => router.push(`/scan/${scan.id}?domain=${encodeURIComponent(scan.domain)}`)}
                    className="hover:bg-surface-100/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-100">
                      {scan.domain}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {scan.overallScore} / 100
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge grade={scan.grade} dot>
                        {scan.grade}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <span className="text-red-400 font-semibold">{scan.summary.criticalFindings}C</span>{" "}
                      <span className="text-orange-400 font-semibold">{scan.summary.highFindings}H</span>{" "}
                      <span className="text-amber-400 font-semibold">{scan.summary.mediumFindings}M</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {formatTimeAgo(scan.scannedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => generateSecurityReportPdf(scan)}
                          title="Download PDF Report"
                          className="p-1.5 rounded bg-surface-100 hover:bg-surface-50 border border-slate-800 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteScan(scan.id, e)}
                          title="Delete Record"
                          className="p-1.5 rounded bg-surface-100 hover:bg-surface-50 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

