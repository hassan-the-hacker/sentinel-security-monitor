"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { CompleteScanResult, SecurityGrade } from "@/types/scanner";
import { formatTimeAgo, cn } from "@/lib/utils";
import { generateSecurityReportPdf } from "@/services/pdf-report-generator";
import { createClient } from "@/lib/supabase/client";

export default function HistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState<CompleteScanResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScans() {
      setLoading(true);
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
        // Fallback to local storage below
      }

      try {
        const historyStr = localStorage.getItem("sentinel_scan_history");
        if (historyStr) {
          setScans(JSON.parse(historyStr));
        } else {
          setScans([]);
        }
      } catch {
        setScans([]);
      } finally {
        setLoading(false);
      }
    }

    loadScans();
  }, []);

  const handleDeleteScan = async (id: string, domain: string) => {
    if (confirm(`Delete scan record for "${domain}"? This action cannot be undone.`)) {
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

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear your entire scan history?")) {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("scans").delete().eq("user_id", user.id);
          }
        }
      } catch {
        // non-fatal
      }
      setScans([]);
      localStorage.removeItem("sentinel_scan_history");
    }
  };

  const filteredScans = scans.filter((s) => {
    const matchesDomain = s.domain.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesGrade = gradeFilter === "ALL" || s.grade === gradeFilter;
    return matchesDomain && matchesGrade;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[90vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-8 border-b border-slate-800/80 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-emerald-400" />
            Scan history
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit trail of previous domain assessments, overall scores, and security findings.
          </p>
        </div>

        {scans.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleClearAll}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear history
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder="Filter domains (e.g. stripe.com)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="text-xs"
          />
        </div>

        {/* Grade Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto w-full sm:w-auto">
          {["ALL", "A+", "A", "B", "C", "D", "F"].map((grade) => (
            <button
              key={grade}
              onClick={() => setGradeFilter(grade)}
              className={cn(
                "px-3 py-1.5 rounded-lg border transition-all text-xs font-medium",
                gradeFilter === grade
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              {grade === "ALL" ? "All grades" : `Grade ${grade}`}
            </button>
          ))}
        </div>
      </div>

      {/* Scans List / Table */}
      {filteredScans.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No assessments found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No scan records matching "${searchQuery}".`
              : "No scans have been recorded in this account yet."}
          </p>
          <div className="pt-2">
            <Link href="/scanner">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Run a new scan
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-3 px-4 font-normal">Target domain</th>
                <th className="py-3 px-4 font-normal">Score</th>
                <th className="py-3 px-4 font-normal">Grade</th>
                <th className="py-3 px-4 font-normal">Findings breakdown</th>
                <th className="py-3 px-4 font-normal">Audited</th>
                <th className="py-3 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredScans.map((scan) => (
                <tr
                  key={scan.id}
                  onClick={() => router.push(`/scan/${scan.id}?domain=${encodeURIComponent(scan.domain)}`)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                    {scan.domain}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {scan.overallScore} / 100
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge grade={scan.grade} dot>
                      Grade {scan.grade}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="text-rose-400">{scan.summary.criticalFindings} crit</span> •{" "}
                    <span className="text-amber-400">{scan.summary.highFindings} high</span> •{" "}
                    <span className="text-emerald-400">{scan.summary.totalPassed} pass</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(scan.scannedAt).toLocaleDateString()} {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/scan/${scan.id}?domain=${encodeURIComponent(scan.domain)}`)}
                        className="text-xs py-1 px-2.5"
                      >
                        View
                      </Button>
                      <button
                        onClick={() => generateSecurityReportPdf(scan)}
                        title="Download PDF"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-emerald-400 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteScan(scan.id, scan.domain)}
                        title="Delete record"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-400 hover:text-rose-400 transition-colors"
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
  );
}

