"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Globe,
  Zap,
  Radar,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  Download,
  ExternalLink,
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
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompleteScanResult } from "@/types/scanner";
import { formatTimeAgo, cn } from "@/lib/utils";
import { generateSecurityReportPdf } from "@/services/pdf-report-generator";
import { createClient } from "@/lib/supabase/client";

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

  const loadScanHistory = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: dbScans, error } = await supabase
            .from("scans")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && dbScans && dbScans.length > 0) {
            const formatted: CompleteScanResult[] = (dbScans as any[])
              .map((s) => {
                if (s.raw_payload) {
                  return { ...(s.raw_payload as CompleteScanResult), id: s.id };
                }
                return null;
              })
              .filter((s): s is CompleteScanResult => s !== null);

            if (formatted.length > 0) {
              setScans(formatted);
              setLoading(false);
              return;
            }
          }
        }
      }
    } catch {
      // Fallback below
    }

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
      setQuickScanError("Please confirm authorization before scanning.");
      return;
    }

    setIsScanning(true);
    router.push(`/scanner?domain=${encodeURIComponent(cleaned)}&authorized=true`);
  };

  const handleDeleteScan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this scan record?")) {
      try {
        const supabase = createClient();
        if (supabase) {
          await supabase.from("scans").delete().eq("id", id);
        }
      } catch {
        // non-fatal
      }
      const updated = scans.filter((s) => s.id !== id);
      setScans(updated);
      localStorage.setItem("sentinel_scan_history", JSON.stringify(updated));
    }
  };

  // Compute live statistics
  const totalScans = scans.length;
  const uniqueDomains = new Set(scans.map((s) => s.domain)).size;
  const avgScore = totalScans > 0 ? Math.round(scans.reduce((acc, s) => acc + s.overallScore, 0) / totalScans) : 0;
  const totalCritical = scans.reduce((acc, s) => acc + (s.summary?.criticalFindings || 0), 0);
  const totalHigh = scans.reduce((acc, s) => acc + (s.summary?.highFindings || 0), 0);
  const totalMedium = scans.reduce((acc, s) => acc + (s.summary?.mediumFindings || 0), 0);
  const totalLow = scans.reduce((acc, s) => acc + (s.summary?.lowFindings || 0), 0);

  // Prepare chart data
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[90vh]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Security Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your external health checks, SSL certificates, and vulnerability posture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/scanner">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New scan
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card glow="none" className="p-5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Total scans</span>
            <Radar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100 tracking-tight">
              {totalScans}
            </span>
            <span className="text-xs text-slate-500">audits completed</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Saved security assessments</p>
        </Card>

        <Card glow="none" className="p-5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Average score</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-bold tracking-tight",
              avgScore >= 80 ? "text-emerald-400" : avgScore >= 60 ? "text-amber-400" : totalScans > 0 ? "text-red-400" : "text-slate-100"
            )}>
              {totalScans > 0 ? avgScore : "—"}
            </span>
            {totalScans > 0 && <span className="text-xs text-slate-500">/ 100</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalScans > 0 ? `Across ${uniqueDomains} monitored domains` : "Awaiting first scan"}
          </p>
        </Card>

        <Card glow="none" className="p-5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Monitored domains</span>
            <Globe className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100 tracking-tight">
              {uniqueDomains}
            </span>
            <span className="text-xs text-slate-500">targets</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Distinct domains audited</p>
        </Card>

        <Card glow="none" className={cn("p-5", totalCritical > 0 && "border-red-500/30")}>
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Critical issues</span>
            <ShieldAlert className={cn("w-4 h-4", totalCritical > 0 ? "text-red-400" : "text-slate-400")} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tracking-tight", totalCritical > 0 ? "text-red-400" : "text-slate-100")}>
              {totalCritical}
            </span>
            <span className="text-xs text-slate-500">critical</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalHigh} high, {totalMedium} medium severity
          </p>
        </Card>
      </div>

      {/* Quick Scan Launcher Card */}
      <Card glow="none" className="p-6 mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            Run a domain check
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Perform a non-invasive passive check on SSL certificates, security headers, and DNS records.
        </p>

        <form onSubmit={handleQuickScan} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="example.com (e.g. cloudflare.com, github.com)"
              value={quickScanDomain}
              onChange={(e) => setQuickScanDomain(e.target.value)}
              className="flex-1 bg-slate-950 text-slate-100 placeholder:text-slate-500 rounded-lg px-4 py-2.5 text-sm border border-slate-700/80 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isScanning}
              className="shrink-0"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start scan
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="dash-auth"
              checked={quickScanAuth}
              onChange={(e) => setQuickScanAuth(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
            />
            <label htmlFor="dash-auth" className="text-xs text-slate-400 cursor-pointer select-none">
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

      {/* Charts & Visual Analytics Section */}
      {totalScans > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Security Score Progression Chart */}
          <Card glow="none" className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Score progression
              </h3>
              <span className="text-xs text-slate-500">Recent audits</span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0b0f19",
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

          {/* Issue Severity Distribution */}
          <Card glow="none" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Severity distribution
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
                        backgroundColor: "#0b0f19",
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

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Critical: {totalCritical}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>High: {totalHigh}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Medium: {totalMedium}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Low: {totalLow}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Scans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-slate-400" />
            Recent assessments ({scans.length})
          </h2>
          {scans.length > 0 && (
            <Link
              href="/history"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
            >
              View all history <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {scans.length === 0 ? (
          <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
              <Radar className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-medium text-slate-200">No security assessments yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Enter a domain in the box above to run an external check on SSL, headers, and DNS security.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.slice(0, 5).map((scan) => (
              <div
                key={scan.id}
                onClick={() => router.push(`/scan/${scan.id}?domain=${encodeURIComponent(scan.domain)}`)}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/80 text-slate-300 font-mono text-sm font-bold border border-slate-700/60">
                    {scan.grade}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {scan.domain}
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        Score: {scan.overallScore}/100
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scanned {formatTimeAgo(scan.scannedAt)} • {scan.durationMs}ms
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      generateSecurityReportPdf(scan);
                    }}
                    title="Export PDF"
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteScan(scan.id, e)}
                    title="Delete record"
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
